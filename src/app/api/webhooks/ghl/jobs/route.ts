import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { geocodeAddress } from '@/lib/geocoding';
import { calculateJobFinancials } from '@/lib/job-calculations';
import {
  extractAttribution,
  extractClientInfo,
  extractLocationId,
  extractContactId,
  mapSourceToChannel,
  getWeekStart,
} from '@/lib/ghl-attribution';

/**
 * POST /api/webhooks/ghl/jobs
 *
 * Webhook endpoint to create a Job from GoHighLevel (via n8n or direct).
 * Called when an opportunity is marked as "Won" in GHL.
 *
 * This will:
 * 1. Create a Job with full attribution tracking
 * 2. Log the event to LeadEvent table
 * 3. Auto-increment sales + revenue in WeeklySales
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle array payload (GHL sometimes sends array)
    // Also handle nested body object (from n8n)
    let payload = Array.isArray(body) ? body[0]?.body || body[0] : body;
    if (payload.body && typeof payload.body === 'object') {
      payload = { ...payload.body, ...payload };
    }

    // Extract using helpers
    const attribution = extractAttribution(payload);
    const clientInfo = extractClientInfo(payload);
    const contactId = extractContactId(payload) || `temp:${Date.now()}`;

    console.log('GHL Jobs Webhook received:', {
      clientName: clientInfo.clientName,
      locationId: extractLocationId(payload),
      jobValue: clientInfo.jobValue,
      contactId,
    });

    // 1. Extract location_id
    const locationId = extractLocationId(payload);
    if (!locationId) {
      console.error('GHL Jobs Webhook: Missing location ID', {
        keys: Object.keys(payload).slice(0, 20)
      });
      return NextResponse.json(
        { error: 'Missing location ID in payload (expected: id, location.id, or locationId)' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // 2. Find organization by GHL location
    const { data: ghlLocation, error: locationError } = await supabase
      .from('GhlLocation')
      .select('organizationId')
      .eq('ghlLocationId', locationId)
      .single();

    if (locationError || !ghlLocation) {
      console.error('GHL Jobs Webhook: Location not found:', locationId);
      return NextResponse.json(
        { error: `GHL Location not found: ${locationId}` },
        { status: 404 }
      );
    }

    const organizationId = ghlLocation.organizationId;

    // 3. Generate job number
    const { data: lastJob } = await supabase
      .from('Job')
      .select('jobNumber')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1001;
    if (lastJob?.jobNumber) {
      const match = lastJob.jobNumber.match(/JOB-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const jobNumber = `JOB-${nextNumber}`;

    // 4. Calculate financials using extracted job value
    const financials = await calculateJobFinancials(clientInfo.jobValue, organizationId);

    // 5. Map source to channel
    let channel = 'other';
    const { data: previousEvent } = await supabase
      .from('LeadEvent')
      .select('channel')
      .eq('organizationId', organizationId)
      .eq('ghlContactId', contactId)
      .in('eventType', ['lead_created', 'estimate_sent', 'contract_signed'])
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (previousEvent?.channel) {
      channel = previousEvent.channel;
    } else {
      channel = mapSourceToChannel(
        attribution.sessionSource,
        attribution.utmMedium,
        attribution.referrer,
        attribution.utmSource
      );
    }

    // 6. Geocode address
    let latitude: number | null = null;
    let longitude: number | null = null;
    if (clientInfo.address && clientInfo.city) {
      const coords = await geocodeAddress(clientInfo.address, clientInfo.city, clientInfo.state || '');
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      }
    }

    // 7. Build notes with contact info and attribution
    const noteParts = [
      clientInfo.phone ? `📞 ${clientInfo.phone}` : '',
      clientInfo.email ? `📧 ${clientInfo.email}` : '',
      attribution.sessionSource ? `Fonte: ${attribution.sessionSource}` : '',
      attribution.utmMedium ? `Meio: ${attribution.utmMedium}` : '',
      attribution.referrer ? `Referência: ${attribution.referrer}` : '',
      attribution.landingPage ? `Página: ${attribution.landingPage}` : '',
      channel ? `Canal: ${channel}` : '',
    ];
    const notes = noteParts.filter(Boolean).join('\n');

    // 8. Log event to LeadEvent table
    const { data: leadEvent } = await supabase
      .from('LeadEvent')
      .insert({
        organizationId,
        ghlContactId: contactId,
        eventType: 'job_won',
        channel,
        eventData: payload,
        ...attribution,
        clientName: clientInfo.clientName,
        email: clientInfo.email,
        phone: clientInfo.phone,
        address: clientInfo.address,
        city: clientInfo.city,
        state: clientInfo.state,
        jobValue: clientInfo.jobValue,
        projectType: clientInfo.projectType,
      })
      .select('id')
      .single();

    // 9. Auto-increment WeeklySales
    const weekStart = getWeekStart(new Date());
    await supabase.rpc('increment_weekly_sales', {
      p_org_id: organizationId,
      p_week_start: weekStart,
      p_channel: channel,
      p_field: 'sales',
      p_amount: 1,
      p_revenue: clientInfo.jobValue,
    });

    // 10. Create the job
    const { data: job, error: jobError } = await supabase
      .from('Job')
      .insert({
        organizationId,
        jobNumber,
        ghlContactId: contactId,
        leadSource: channel,
        clientName: clientInfo.clientName,
        address: clientInfo.address || '',
        city: clientInfo.city || '',
        state: clientInfo.state || '',
        latitude,
        longitude,
        projectType: clientInfo.projectType,
        status: 'got_the_job',
        jobDate: new Date().toISOString(),
        jobValue: clientInfo.jobValue,
        ...financials,
        notes,
      })
      .select('id, jobNumber')
      .single();

    if (jobError) {
      console.error('GHL Jobs Webhook: Failed to create job:', jobError);
      throw jobError;
    }

    console.log('GHL Jobs Webhook: Job created successfully:', {
      job,
      channel,
      eventId: leadEvent?.id,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      jobNumber: job.jobNumber,
      channel,
      message: `Job ${job.jobNumber} created successfully`,
    }, { status: 201 });

  } catch (error) {
    console.error('GHL Jobs Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to create job from webhook' },
      { status: 500 }
    );
  }
}


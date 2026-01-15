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
 * POST /api/webhooks/ghl/contracts
 *
 * Webhook endpoint to track signed contracts from GoHighLevel.
 * Called when a client signs a contract/proposal.
 *
 * This will:
 * 1. Log the event to LeadEvent table
 * 2. Auto-increment the sales count + revenue in WeeklySales
 * 3. Create a Job record if one doesn't exist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle array payload and nested body
    let payload = Array.isArray(body) ? body[0]?.body || body[0] : body;
    if (payload.body && typeof payload.body === 'object') {
      payload = { ...payload.body, ...payload };
    }

    const eventType = 'contract_signed';

    console.log('GHL Contracts Webhook received:', {
      contactId: extractContactId(payload),
      locationId: extractLocationId(payload),
    });

    // 1. Extract location ID
    const locationId = extractLocationId(payload);
    if (!locationId) {
      console.error('GHL Contracts Webhook: Missing location ID');
      return NextResponse.json(
        { error: 'Missing location ID in payload' },
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
      console.error('GHL Contracts Webhook: Location not found:', locationId);
      return NextResponse.json(
        { error: `GHL Location not found: ${locationId}` },
        { status: 404 }
      );
    }

    const organizationId = ghlLocation.organizationId;

    // 3. Extract attribution and client info
    const attribution = extractAttribution(payload);
    const clientInfo = extractClientInfo(payload);
    const contactId = extractContactId(payload) || `temp:${Date.now()}`;

    // 4. Get channel from previous events for this contact
    let channel = 'other';
    const { data: previousEvent } = await supabase
      .from('LeadEvent')
      .select('channel')
      .eq('organizationId', organizationId)
      .eq('ghlContactId', contactId)
      .in('eventType', ['lead_created', 'estimate_sent'])
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

    console.log('GHL Contracts Webhook: Using channel:', channel, 'Job value:', clientInfo.jobValue);

    // 5. Log event to LeadEvent table
    const { data: leadEvent, error: eventError } = await supabase
      .from('LeadEvent')
      .insert({
        organizationId,
        ghlContactId: contactId,
        eventType,
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

    if (eventError) {
      console.error('GHL Contracts Webhook: Failed to log event:', eventError);
      throw eventError;
    }

    // 6. Auto-increment WeeklySales sales count + revenue
    const weekStart = getWeekStart(new Date());
    const { error: salesError } = await supabase.rpc('increment_weekly_sales', {
      p_org_id: organizationId,
      p_week_start: weekStart,
      p_channel: channel,
      p_field: 'sales',
      p_amount: 1,
      p_revenue: clientInfo.jobValue,
    });

    if (salesError) {
      console.error('GHL Contracts Webhook: Failed to increment WeeklySales:', salesError);
    }

    // 7. Check if job already exists for this contact
    let jobId: string | null = null;
    let jobNumber: string | null = null;

    const { data: existingJob } = await supabase
      .from('Job')
      .select('id, jobNumber')
      .eq('organizationId', organizationId)
      .eq('ghlContactId', contactId)
      .single();

    if (existingJob) {
      jobId = existingJob.id;
      jobNumber = existingJob.jobNumber;
      console.log('GHL Contracts Webhook: Job already exists:', jobNumber);
    } else if (clientInfo.jobValue > 0) {
      // 8. Create new job if we have a job value
      // Generate job number
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
      jobNumber = `JOB-${nextNumber}`;

      // Calculate financials
      const financials = await calculateJobFinancials(clientInfo.jobValue, organizationId);

      // Geocode address
      let latitude: number | null = null;
      let longitude: number | null = null;
      if (clientInfo.address && clientInfo.city) {
        const coords = await geocodeAddress(clientInfo.address, clientInfo.city, clientInfo.state || '');
        if (coords) {
          latitude = coords.lat;
          longitude = coords.lng;
        }
      }

      // Build notes
      const noteParts = [
        clientInfo.phone ? `📞 ${clientInfo.phone}` : '',
        clientInfo.email ? `📧 ${clientInfo.email}` : '',
        attribution.sessionSource ? `Fonte: ${attribution.sessionSource}` : '',
        attribution.utmMedium ? `Meio: ${attribution.utmMedium}` : '',
        channel ? `Canal: ${channel}` : '',
      ];
      const notes = noteParts.filter(Boolean).join('\n');

      // Create job
      const { data: newJob, error: jobError } = await supabase
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
        console.error('GHL Contracts Webhook: Failed to create job:', jobError);
      } else {
        jobId = newJob?.id;
        jobNumber = newJob?.jobNumber;
        console.log('GHL Contracts Webhook: Job created:', jobNumber);
      }
    }

    console.log('GHL Contracts Webhook: Success', {
      eventId: leadEvent?.id,
      channel,
      jobId,
      jobNumber,
      weekStart,
    });

    return NextResponse.json(
      {
        success: true,
        eventId: leadEvent?.id,
        jobId,
        jobNumber,
        channel,
        message: `Contract signed tracked. Job: ${jobNumber || 'Not created (no value)'}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('GHL Contracts Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process contract webhook' },
      { status: 500 }
    );
  }
}

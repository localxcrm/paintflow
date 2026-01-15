import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  extractAttribution,
  extractClientInfo,
  extractLocationId,
  extractContactId,
  mapSourceToChannel,
  getWeekStart,
} from '@/lib/ghl-attribution';

/**
 * POST /api/webhooks/ghl/leads
 *
 * Webhook endpoint to track leads from GoHighLevel.
 * Called when:
 * - A new contact is created
 * - An appointment is booked
 *
 * This will:
 * 1. Log the event to LeadEvent table with full attribution
 * 2. Auto-increment the leads count in WeeklySales for the mapped channel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle array payload (GHL sometimes sends array) and nested body
    let payload = Array.isArray(body) ? body[0]?.body || body[0] : body;
    if (payload.body && typeof payload.body === 'object') {
      payload = { ...payload.body, ...payload };
    }

    // Determine event type from payload
    const eventType = payload.eventType || payload.event_type || 'lead_created';

    console.log('GHL Leads Webhook received:', {
      eventType,
      contactId: extractContactId(payload),
      locationId: extractLocationId(payload),
    });

    // 1. Extract location ID
    const locationId = extractLocationId(payload);
    if (!locationId) {
      console.error('GHL Leads Webhook: Missing location ID', {
        keys: Object.keys(payload).slice(0, 20),
      });
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
      console.error('GHL Leads Webhook: Location not found:', locationId);
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

    // 4. Map source to channel
    const channel = mapSourceToChannel(
      attribution.sessionSource,
      attribution.utmMedium,
      attribution.referrer,
      attribution.utmSource
    );

    console.log('GHL Leads Webhook: Mapped channel:', {
      sessionSource: attribution.sessionSource,
      medium: attribution.utmMedium,
      channel,
    });

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
      console.error('GHL Leads Webhook: Failed to log event:', eventError);
      throw eventError;
    }

    // 6. Auto-increment WeeklySales leads count for this channel
    const weekStart = getWeekStart(new Date());
    const { data: salesResult, error: salesError } = await supabase.rpc(
      'increment_weekly_sales',
      {
        p_org_id: organizationId,
        p_week_start: weekStart,
        p_channel: channel,
        p_field: 'leads',
        p_amount: 1,
        p_revenue: 0,
      }
    );

    if (salesError) {
      console.error('GHL Leads Webhook: Failed to increment WeeklySales:', salesError);
      // Don't fail the whole request, just log the error
    }

    console.log('GHL Leads Webhook: Success', {
      eventId: leadEvent?.id,
      channel,
      weekStart,
      salesResult,
    });

    return NextResponse.json(
      {
        success: true,
        eventId: leadEvent?.id,
        channel,
        message: `Lead tracked for channel: ${channel}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('GHL Leads Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process lead webhook' },
      { status: 500 }
    );
  }
}

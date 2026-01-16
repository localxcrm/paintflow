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
 * POST /api/webhooks/ghl/estimates
 *
 * Webhook endpoint to track estimates sent from GoHighLevel.
 * Called when an estimate/proposal is sent to a client.
 *
 * This will:
 * 1. Log the event to LeadEvent table
 * 2. Auto-increment the estimates count in WeeklySales for the mapped channel
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle array payload and nested body
    let payload = Array.isArray(body) ? body[0]?.body || body[0] : body;
    if (payload.body && typeof payload.body === 'object') {
      payload = { ...payload.body, ...payload };
    }

    const eventType = 'estimate_sent';

    console.log('GHL Estimates Webhook received:', {
      contactId: extractContactId(payload),
      locationId: extractLocationId(payload),
    });

    // 1. Extract location ID
    const locationId = extractLocationId(payload);
    if (!locationId) {
      console.error('GHL Estimates Webhook: Missing location ID');
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
      console.error('GHL Estimates Webhook: Location not found:', locationId);
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

    // 4. Try to get channel from previous lead event for this contact
    let channel = 'other';
    const { data: previousEvent } = await supabase
      .from('LeadEvent')
      .select('channel')
      .eq('organizationId', organizationId)
      .eq('ghlContactId', contactId)
      .eq('eventType', 'lead_created')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (previousEvent?.channel) {
      channel = previousEvent.channel;
    } else {
      // Fallback to mapping from current payload
      channel = mapSourceToChannel(
        attribution.sessionSource,
        attribution.utmMedium,
        attribution.referrer,
        attribution.utmSource
      );
    }

    console.log('GHL Estimates Webhook: Using channel:', channel);

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
        serviceType: clientInfo.serviceType,
      })
      .select('id')
      .single();

    if (eventError) {
      console.error('GHL Estimates Webhook: Failed to log event:', eventError);
      throw eventError;
    }

    // 6. Auto-increment WeeklySales estimates count
    const weekStart = getWeekStart(new Date());
    const { error: salesError } = await supabase.rpc('increment_weekly_sales', {
      p_org_id: organizationId,
      p_week_start: weekStart,
      p_channel: channel,
      p_field: 'estimates',
      p_amount: 1,
      p_revenue: 0,
    });

    if (salesError) {
      console.error('GHL Estimates Webhook: Failed to increment WeeklySales:', salesError);
    }

    console.log('GHL Estimates Webhook: Success', {
      eventId: leadEvent?.id,
      channel,
      weekStart,
    });

    return NextResponse.json(
      {
        success: true,
        eventId: leadEvent?.id,
        channel,
        message: `Estimate tracked for channel: ${channel}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('GHL Estimates Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process estimate webhook' },
      { status: 500 }
    );
  }
}

// GHL Webhook Endpoint
// Receives real-time events from GoHighLevel

import { NextRequest, NextResponse } from 'next/server';
import { handleWebhook } from '@/lib/ghl';
import type { GhlWebhookPayload } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from header if present
    const webhookSecret = request.headers.get('x-ghl-signature') || undefined;

    // Parse the payload
    const payload = await request.json() as GhlWebhookPayload;

    // Validate required fields
    if (!payload.type || !payload.locationId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, locationId' },
        { status: 400 }
      );
    }

    console.log(`[GHL Webhook] Received ${payload.type} for location ${payload.locationId}`);

    // Process the webhook
    const result = await handleWebhook(payload, webhookSecret);

    if (!result.success) {
      console.error(`[GHL Webhook] Error: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log(`[GHL Webhook] Processed successfully${result.leadId ? `, lead: ${result.leadId}` : ''}`);

    return NextResponse.json({
      success: true,
      leadId: result.leadId,
    });

  } catch (error) {
    console.error('[GHL Webhook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check for webhook endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'GHL Webhook',
    timestamp: new Date().toISOString(),
  });
}

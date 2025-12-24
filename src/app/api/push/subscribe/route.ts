import { NextRequest, NextResponse } from 'next/server';
import {
  createServerSupabaseClient,
  getOrganizationIdFromRequest,
  getSessionTokenFromRequest,
  validateSession,
} from '@/lib/supabase-server';

// POST /api/push/subscribe - Save push subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, userType, workOrderToken } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    if (!userType || !['admin', 'subcontractor'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid userType' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    let organizationId: string | null = null;

    // For admin users, get organizationId from session/cookies
    if (userType === 'admin') {
      // Try to get from organization cookie first
      organizationId = getOrganizationIdFromRequest(request);

      if (!organizationId) {
        // Fall back to session validation
        const sessionToken = getSessionTokenFromRequest(request);
        if (sessionToken) {
          const session = await validateSession(sessionToken);
          organizationId = session?.organizationId || null;
        }
      }

      if (!organizationId) {
        return NextResponse.json(
          { error: 'Organization ID required for admin' },
          { status: 400 }
        );
      }
    }

    // For subcontractor, validate the work order token
    if (userType === 'subcontractor') {
      if (!workOrderToken) {
        return NextResponse.json(
          { error: 'Work order token required for subcontractor' },
          { status: 400 }
        );
      }

      // Verify the token exists
      const { data: workOrder } = await supabase
        .from('WorkOrder')
        .select('id, organizationId')
        .eq('publicToken', workOrderToken)
        .single();

      if (!workOrder) {
        return NextResponse.json(
          { error: 'Invalid work order token' },
          { status: 400 }
        );
      }

      organizationId = workOrder.organizationId;
    }

    // Upsert the subscription (update if endpoint exists, insert if not)
    const { error } = await supabase
      .from('PushSubscription')
      .upsert(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          organizationId,
          workOrderToken: userType === 'subcontractor' ? workOrderToken : null,
          userType,
          updatedAt: new Date().toISOString(),
        },
        {
          onConflict: 'endpoint',
        }
      );

    if (error) {
      console.error('Error saving subscription:', error);
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in push subscribe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/push/subscribe - Remove push subscription
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('PushSubscription')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error deleting subscription:', error);
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in push unsubscribe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

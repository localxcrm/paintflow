import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest, getSessionTokenFromRequest } from '@/lib/supabase-server';

// GET /api/notifications - Get admin notifications
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const sessionToken = getSessionTokenFromRequest(request);
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Get session to get userId
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('userId')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.userId;

    // Get notifications for this admin user
    const { data: notifications, error: notificationsError } = await supabase
      .from('Notification')
      .select('*')
      .eq('userId', userId)
      .eq('userType', 'admin')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false })
      .limit(50);

    if (notificationsError) {
      throw notificationsError;
    }

    // Count unread notifications
    const unreadCount = notifications ? notifications.filter((n: any) => !n.isRead).length : 0;

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const sessionToken = getSessionTokenFromRequest(request);
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, isRead } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get session to get userId
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('userId')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.userId;

    // Update notification
    const { data: notification, error: updateError } = await supabase
      .from('Notification')
      .update({
        isRead,
        readAt: isRead ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('userId', userId)
      .eq('userType', 'admin')
      .eq('organizationId', organizationId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSessionTokenFromRequest } from '@/lib/supabase-server';

// PATCH /api/notifications/[id] - Mark notification as read (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Verify notification belongs to this user
    const { data: notification, error: checkError } = await supabase
      .from('Notification')
      .select('id')
      .eq('id', id)
      .eq('userId', userId)
      .eq('userType', 'admin')
      .single();

    if (checkError || !notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Update notification
    const { error: updateError } = await supabase
      .from('Notification')
      .update({
        isRead: true,
        readAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSubSessionToken } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/sub/notifications - Get sub notifications
export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getSubSessionToken();
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get session first
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('*')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if session expired
    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get user separately
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', session.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401, headers: corsHeaders }
      );
    }

    if (user.role !== 'subcontractor') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get subcontractor data
    const { data: subcontractor } = await supabase
      .from('Subcontractor')
      .select('id')
      .eq('userId', user.id)
      .single();

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subcontractor not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get notifications for this subcontractor
    const { data: notifications, error: notificationsError } = await supabase
      .from('Notification')
      .select('*')
      .eq('userId', subcontractor.id)
      .eq('userType', 'sub')
      .order('createdAt', { ascending: false })
      .limit(50);

    if (notificationsError) {
      throw notificationsError;
    }

    // Count unread notifications
    const unreadCount = notifications ? notifications.filter((n: any) => !n.isRead).length : 0;

    return NextResponse.json(
      {
        notifications: notifications || [],
        unreadCount,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error fetching sub notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500, headers: corsHeaders }
    );
  }
}

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

const SUB_SESSION_COOKIE = 'paintpro_sub_session';

// POST /api/push/device-token - Save device token for native push notifications
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, platform, userId: providedUserId } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Try to get user ID from session if not provided
    let userId = providedUserId;

    if (!userId) {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get(SUB_SESSION_COOKIE)?.value;

      if (sessionToken) {
        const { data: session } = await supabase
          .from('Session')
          .select('*, User(*)')
          .eq('token', sessionToken)
          .single();

        userId = session?.User?.id;
      }
    }

    // Upsert device token
    const { error } = await supabase
      .from('DeviceToken')
      .upsert(
        {
          token,
          platform: platform || 'ios',
          userId: userId || null,
          updatedAt: new Date().toISOString(),
        },
        {
          onConflict: 'token',
        }
      );

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        console.log('DeviceToken table does not exist yet');
        return NextResponse.json({ success: true, message: 'Table not created' });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving device token:', error);
    return NextResponse.json(
      { error: 'Failed to save device token' },
      { status: 500 }
    );
  }
}

// DELETE /api/push/device-token - Remove device token
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    await supabase
      .from('DeviceToken')
      .delete()
      .eq('token', token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting device token:', error);
    return NextResponse.json(
      { error: 'Failed to delete device token' },
      { status: 500 }
    );
  }
}

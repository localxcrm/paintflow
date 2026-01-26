import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest, getSubIdFromRequest } from '@/lib/supabase-server';

interface DeviceTokenBody {
  token: string;
  platform: 'ios' | 'android' | 'web';
  userId?: string;
}

// POST /api/push/device-token - Register a device token
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json() as DeviceTokenBody;

    if (!body.token || !body.platform) {
      return NextResponse.json({ error: 'token and platform are required' }, { status: 400 });
    }

    const orgId = getOrganizationIdFromRequest(request);
    const subId = getSubIdFromRequest(request);

    // Upsert the device token
    const { data, error } = await supabase
      .from('DeviceToken')
      .upsert({
        token: body.token,
        platform: body.platform,
        userId: body.userId || null,
        subcontractorId: subId || null,
        organizationId: orgId || null,
        isActive: true,
        lastUsedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, {
        onConflict: 'token',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving device token:', error);
      return NextResponse.json({ error: 'Failed to save device token' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Error in device token endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/push/device-token - Unregister a device token
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    // Soft delete - mark as inactive
    const { error } = await supabase
      .from('DeviceToken')
      .update({ 
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .eq('token', token);

    if (error) {
      console.error('Error deactivating device token:', error);
      return NextResponse.json({ error: 'Failed to deactivate token' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in device token endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

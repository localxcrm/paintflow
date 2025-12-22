// GHL Pipelines API - Get pipelines for a connection
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getPipelines } from '@/lib/ghl';
import type { GhlConnection } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'connectionId is required' },
        { status: 400 }
      );
    }

    const { data: connection, error } = await supabaseAdmin
      .from('GhlConnection')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error || !connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    const pipelines = await getPipelines(connection as GhlConnection);

    return NextResponse.json({ pipelines });

  } catch (error) {
    console.error('[GHL Pipelines] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
}

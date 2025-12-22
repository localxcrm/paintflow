// GHL Sync Endpoint
// Manual sync / polling backup for GoHighLevel data

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { fullSync, syncContacts, syncOpportunities, getConnectionsByTenant } from '@/lib/ghl';
import type { GhlConnection } from '@/types/database';

// POST /api/ghl/sync - Trigger sync for a connection
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId, syncType = 'full' } = body;

    if (!connectionId) {
      return NextResponse.json(
        { error: 'connectionId is required' },
        { status: 400 }
      );
    }

    // Get the connection
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

    const conn = connection as GhlConnection;

    // Perform sync based on type
    let result;

    switch (syncType) {
      case 'contacts':
        const contactCount = await syncContacts(conn);
        result = { contacts: contactCount, opportunities: 0 };
        break;

      case 'opportunities':
        const oppCount = await syncOpportunities(conn);
        result = { contacts: 0, opportunities: oppCount };
        break;

      case 'full':
      default:
        result = await fullSync(conn);
        break;
    }

    return NextResponse.json({
      success: true,
      synced: result,
      connectionId,
      syncType,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[GHL Sync] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

// GET /api/ghl/sync - Get sync status for all connections
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const connections = await getConnectionsByTenant(tenantId);

    const syncStatus = connections.map(conn => ({
      id: conn.id,
      locationId: conn.locationId,
      locationName: conn.locationName,
      lastSyncAt: conn.lastSyncAt,
      lastSyncStatus: conn.lastSyncStatus,
      lastSyncError: conn.lastSyncError,
      syncEnabled: conn.syncEnabled,
    }));

    return NextResponse.json({ connections: syncStatus });

  } catch (error) {
    console.error('[GHL Sync Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}

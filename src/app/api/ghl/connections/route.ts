// GHL Connections Management API
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { testConnection, getPipelines } from '@/lib/ghl';
import type { GhlConnection, GhlConnectionInsert, GhlConnectionUpdate } from '@/types/database';
import crypto from 'crypto';

// GET /api/ghl/connections - List all connections for a tenant
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

    const { data, error } = await supabaseAdmin
      .from('GhlConnection')
      .select('*')
      .eq('tenantId', tenantId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw error;
    }

    // Remove sensitive data from response
    const connections = (data || []).map((conn: GhlConnection) => ({
      ...conn,
      apiKey: '***hidden***',
      accessToken: conn.accessToken ? '***hidden***' : null,
      refreshToken: conn.refreshToken ? '***hidden***' : null,
      webhookSecret: conn.webhookSecret ? '***hidden***' : null,
    }));

    return NextResponse.json({ connections });

  } catch (error) {
    console.error('[GHL Connections] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

// POST /api/ghl/connections - Create a new connection
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, workspaceId, locationId, apiKey } = body;

    if (!tenantId || !locationId || !apiKey) {
      return NextResponse.json(
        { error: 'tenantId, locationId, and apiKey are required' },
        { status: 400 }
      );
    }

    // Test the connection first
    const testResult = await testConnection(apiKey, locationId);

    if (!testResult.success) {
      return NextResponse.json(
        { error: `Connection test failed: ${testResult.error}` },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const { data: existing } = await supabaseAdmin
      .from('GhlConnection')
      .select('id')
      .eq('locationId', locationId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A connection with this location ID already exists' },
        { status: 409 }
      );
    }

    // Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Create the connection
    const connectionData: GhlConnectionInsert = {
      tenantId,
      workspaceId: workspaceId || null,
      locationId,
      locationName: testResult.locationName || 'Unknown Location',
      apiKey,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      webhookSecret,
      webhookUrl: null, // Will be set after deployment
      webhookEnabled: true,
      syncEnabled: true,
      lastSyncAt: null,
      lastSyncStatus: null,
      lastSyncError: null,
      pipelineId: null,
      pipelineName: null,
      stageMapping: {},
      isActive: true,
    };

    const { data: newConnection, error } = await supabaseAdmin
      .from('GhlConnection')
      .insert(connectionData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Fetch available pipelines
    const pipelines = await getPipelines(newConnection as GhlConnection);

    return NextResponse.json({
      connection: {
        ...newConnection,
        apiKey: '***hidden***',
      },
      pipelines,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/ghl/webhook`,
    });

  } catch (error) {
    console.error('[GHL Connections] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}

// PATCH /api/ghl/connections - Update a connection
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Connection id is required' },
        { status: 400 }
      );
    }

    // Don't allow updating certain fields directly
    const safeUpdate: GhlConnectionUpdate = {};

    if (updateData.pipelineId !== undefined) safeUpdate.pipelineId = updateData.pipelineId;
    if (updateData.pipelineName !== undefined) safeUpdate.pipelineName = updateData.pipelineName;
    if (updateData.stageMapping !== undefined) safeUpdate.stageMapping = updateData.stageMapping;
    if (updateData.webhookEnabled !== undefined) safeUpdate.webhookEnabled = updateData.webhookEnabled;
    if (updateData.syncEnabled !== undefined) safeUpdate.syncEnabled = updateData.syncEnabled;
    if (updateData.isActive !== undefined) safeUpdate.isActive = updateData.isActive;

    const { data, error } = await supabaseAdmin
      .from('GhlConnection')
      .update(safeUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      connection: {
        ...data,
        apiKey: '***hidden***',
        accessToken: data.accessToken ? '***hidden***' : null,
        refreshToken: data.refreshToken ? '***hidden***' : null,
        webhookSecret: data.webhookSecret ? '***hidden***' : null,
      },
    });

  } catch (error) {
    console.error('[GHL Connections] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}

// DELETE /api/ghl/connections - Delete a connection
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Connection id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('GhlConnection')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[GHL Connections] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}

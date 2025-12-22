// Targets (Goals) API
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { Target, TargetInsert, TargetUpdate } from '@/types/database';

// GET /api/targets - List targets
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const year = searchParams.get('year');
    const periodType = searchParams.get('periodType');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('Target')
      .select('*')
      .eq('tenantId', tenantId);

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    if (periodType) {
      query = query.eq('periodType', periodType);
    }

    const { data, error } = await query.order('year', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ targets: data });

  } catch (error) {
    console.error('[Targets] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch targets' },
      { status: 500 }
    );
  }
}

// POST /api/targets - Create a new target
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tenantId,
      workspaceId,
      year,
      periodType = 'annual',
      period,
      revenueTarget = 0,
      jobsTarget = 0,
      leadsTarget = 0,
      estimatesTarget = 0,
      closeRateTarget = 30,
      averageTicketTarget = 0,
      marketingBudget = 0,
      cplTarget = 0,
      cacTarget = 0,
      notes,
    } = body;

    if (!tenantId || !year) {
      return NextResponse.json(
        { error: 'tenantId and year are required' },
        { status: 400 }
      );
    }

    // Auto-calculate derived values if not provided
    let calculatedLeadsTarget = leadsTarget;
    let calculatedJobsTarget = jobsTarget;

    if (averageTicketTarget > 0 && revenueTarget > 0 && jobsTarget === 0) {
      calculatedJobsTarget = Math.ceil(revenueTarget / averageTicketTarget);
    }

    if (closeRateTarget > 0 && calculatedJobsTarget > 0 && leadsTarget === 0) {
      calculatedLeadsTarget = Math.ceil(calculatedJobsTarget / (closeRateTarget / 100));
    }

    const targetData: TargetInsert = {
      tenantId,
      workspaceId: workspaceId || null,
      year,
      periodType,
      period: period || null,
      revenueTarget,
      jobsTarget: calculatedJobsTarget,
      leadsTarget: calculatedLeadsTarget,
      estimatesTarget: estimatesTarget || calculatedLeadsTarget,
      closeRateTarget,
      averageTicketTarget,
      marketingBudget,
      cplTarget,
      cacTarget,
      notes: notes || null,
    };

    const { data, error } = await supabaseAdmin
      .from('Target')
      .upsert(targetData, {
        onConflict: 'tenantId,year,periodType,period',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ target: data });

  } catch (error) {
    console.error('[Targets] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create target' },
      { status: 500 }
    );
  }
}

// PATCH /api/targets - Update a target
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
        { error: 'Target id is required' },
        { status: 400 }
      );
    }

    const safeUpdate: TargetUpdate = {};

    if (updateData.revenueTarget !== undefined) safeUpdate.revenueTarget = updateData.revenueTarget;
    if (updateData.jobsTarget !== undefined) safeUpdate.jobsTarget = updateData.jobsTarget;
    if (updateData.leadsTarget !== undefined) safeUpdate.leadsTarget = updateData.leadsTarget;
    if (updateData.estimatesTarget !== undefined) safeUpdate.estimatesTarget = updateData.estimatesTarget;
    if (updateData.closeRateTarget !== undefined) safeUpdate.closeRateTarget = updateData.closeRateTarget;
    if (updateData.averageTicketTarget !== undefined) safeUpdate.averageTicketTarget = updateData.averageTicketTarget;
    if (updateData.marketingBudget !== undefined) safeUpdate.marketingBudget = updateData.marketingBudget;
    if (updateData.cplTarget !== undefined) safeUpdate.cplTarget = updateData.cplTarget;
    if (updateData.cacTarget !== undefined) safeUpdate.cacTarget = updateData.cacTarget;
    if (updateData.notes !== undefined) safeUpdate.notes = updateData.notes;

    const { data, error } = await supabaseAdmin
      .from('Target')
      .update(safeUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ target: data });

  } catch (error) {
    console.error('[Targets] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update target' },
      { status: 500 }
    );
  }
}

// DELETE /api/targets - Delete a target
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
        { error: 'Target id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('Target')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Targets] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete target' },
      { status: 500 }
    );
  }
}

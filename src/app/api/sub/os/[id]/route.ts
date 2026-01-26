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

// GET /api/sub/os/[id] - Get a single work order for subcontractor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = await getSubSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();
    const { id } = await params;

    // Get session with user
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('*, User(*)')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get subcontractor linked to this user
    const { data: subcontractor, error: subError } = await supabase
      .from('Subcontractor')
      .select('id, organizationId')
      .eq('userId', session.userId)
      .single();

    if (subError || !subcontractor) {
      return NextResponse.json(
        { error: 'Subcontratado não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get the work order with job details
    const { data: workOrder, error: woError } = await supabase
      .from('WorkOrder')
      .select(`
        *,
        job:Job(
          id,
          jobNumber,
          clientName,
          address,
          city,
          state,
          zipCode,
          subcontractorId
        ),
        organization:Organization(
          id,
          name,
          logo
        )
      `)
      .eq('id', id)
      .eq('organizationId', subcontractor.organizationId)
      .single();

    if (woError || !workOrder) {
      return NextResponse.json(
        { error: 'OS não encontrada' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify that this work order's job is assigned to this subcontractor
    if (workOrder.job?.subcontractorId !== subcontractor.id) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403, headers: corsHeaders }
      );
    }

    return NextResponse.json(workOrder, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH /api/sub/os/[id] - Update work order (tasks, rooms, photos)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = await getSubSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // Get session with user
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('*, User(*)')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get subcontractor linked to this user
    const { data: subcontractor, error: subError } = await supabase
      .from('Subcontractor')
      .select('id, organizationId')
      .eq('userId', session.userId)
      .single();

    if (subError || !subcontractor) {
      return NextResponse.json(
        { error: 'Subcontratado não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get current work order to verify access
    const { data: currentWO, error: currentError } = await supabase
      .from('WorkOrder')
      .select('*, job:Job(subcontractorId)')
      .eq('id', id)
      .eq('organizationId', subcontractor.organizationId)
      .single();

    if (currentError || !currentWO) {
      return NextResponse.json(
        { error: 'OS não encontrada' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify access
    if (currentWO.job?.subcontractorId !== subcontractor.id) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Build update data - only allow certain fields to be updated by subcontractor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.tasks !== undefined) updateData.tasks = body.tasks;
    if (body.rooms !== undefined) updateData.rooms = body.rooms;
    if (body.photos !== undefined) updateData.photos = body.photos;
    if (body.comments !== undefined) updateData.comments = body.comments;
    if (body.actualStartDate !== undefined) updateData.actualStartDate = body.actualStartDate;
    if (body.actualEndDate !== undefined) updateData.actualEndDate = body.actualEndDate;

    // Update work order
    const { data: workOrder, error: updateError } = await supabase
      .from('WorkOrder')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        job:Job(
          id,
          jobNumber,
          clientName,
          address,
          city,
          state,
          zipCode,
          subcontractorId
        ),
        organization:Organization(
          id,
          name,
          logo
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(workOrder, { headers: corsHeaders });
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500, headers: corsHeaders }
    );
  }
}

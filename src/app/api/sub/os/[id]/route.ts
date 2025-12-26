import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

const SUB_SESSION_COOKIE = 'paintpro_sub_session';

// Helper to get the authenticated subcontractor
async function getAuthenticatedSubcontractor() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SUB_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return { error: 'Não autenticado', status: 401 };
  }

  const supabase = createServerSupabaseClient();

  const { data: session, error: sessionError } = await supabase
    .from('Session')
    .select('*, User(*)')
    .eq('token', sessionToken)
    .single();

  if (sessionError || !session) {
    return { error: 'Sessão inválida', status: 401 };
  }

  const { data: subcontractor, error: subError } = await supabase
    .from('Subcontractor')
    .select('id, organizationId')
    .eq('userId', session.userId)
    .single();

  if (subError || !subcontractor) {
    return { error: 'Subcontratado não encontrado', status: 404 };
  }

  return { subcontractor, supabase };
}

// GET /api/sub/os/[id] - Get work order detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedSubcontractor();

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { subcontractor, supabase } = auth;

    // Get work order with job
    const { data: workOrder, error: woError } = await supabase
      .from('WorkOrder')
      .select(`
        *,
        Job (
          id,
          jobNumber,
          clientName,
          address,
          city,
          state,
          zipCode,
          subcontractorId,
          subcontractorPrice
        ),
        Organization (
          id,
          name,
          logo
        )
      `)
      .eq('id', id)
      .single();

    if (woError || !workOrder) {
      return NextResponse.json(
        { error: 'OS não encontrada' },
        { status: 404 }
      );
    }

    // Verify the work order belongs to a job assigned to this subcontractor
    if (workOrder.Job?.subcontractorId !== subcontractor.id) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    // Format response
    const response = {
      ...workOrder,
      job: workOrder.Job,
      organization: workOrder.Organization,
      subcontractorPrice: workOrder.Job?.subcontractorPrice || 0,
      rooms: workOrder.rooms || [],
      tasks: workOrder.tasks || [],
      materials: workOrder.materials || [],
      photos: workOrder.photos || [],
      comments: workOrder.comments || [],
    };

    delete response.Job;
    delete response.Organization;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}

// PATCH /api/sub/os/[id] - Update work order (tasks, comments, photos)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedSubcontractor();

    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { subcontractor, supabase } = auth;

    // Verify ownership first
    const { data: workOrder, error: woError } = await supabase
      .from('WorkOrder')
      .select(`
        id,
        rooms,
        tasks,
        photos,
        comments,
        Job!inner (subcontractorId)
      `)
      .eq('id', id)
      .single();

    if (woError || !workOrder) {
      return NextResponse.json(
        { error: 'OS não encontrada' },
        { status: 404 }
      );
    }

    const jobData = workOrder.Job as { subcontractorId: string } | { subcontractorId: string }[];
    const subcontractorId = Array.isArray(jobData) ? jobData[0]?.subcontractorId : jobData?.subcontractorId;

    if (subcontractorId !== subcontractor.id) {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Only allow updating specific fields
    if (body.tasks !== undefined) updateData.tasks = body.tasks;
    if (body.rooms !== undefined) updateData.rooms = body.rooms;
    if (body.comments !== undefined) updateData.comments = body.comments;
    if (body.photos !== undefined) updateData.photos = body.photos;

    const { data: updated, error: updateError } = await supabase
      .from('WorkOrder')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        Job (
          id,
          jobNumber,
          clientName,
          address,
          city,
          state,
          zipCode,
          subcontractorPrice
        ),
        Organization (
          id,
          name,
          logo
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating work order:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar OS' },
        { status: 500 }
      );
    }

    // Format response
    const response = {
      ...updated,
      job: updated.Job,
      organization: updated.Organization,
      subcontractorPrice: updated.Job?.subcontractorPrice || 0,
      rooms: updated.rooms || [],
      tasks: updated.tasks || [],
      materials: updated.materials || [],
      photos: updated.photos || [],
      comments: updated.comments || [],
    };

    delete response.Job;
    delete response.Organization;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}

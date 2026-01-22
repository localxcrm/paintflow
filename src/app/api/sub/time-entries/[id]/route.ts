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

async function verifyTimeEntryOwnership(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  timeEntryId: string,
  subcontractorId: string
) {
  // Get time entry and verify employee belongs to subcontractor
  const { data: timeEntry } = await supabase
    .from('TimeEntry')
    .select(`
      *,
      SubcontractorEmployee!inner (
        subcontractorId
      )
    `)
    .eq('id', timeEntryId)
    .eq('SubcontractorEmployee.subcontractorId', subcontractorId)
    .single();

  return timeEntry;
}

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

    // Get session and verify subcontractor
    const { data: session } = await supabase
      .from('Session')
      .select('*, User(*)')
      .eq('token', sessionToken)
      .single();

    if (!session || session.User.role !== 'subcontractor') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { data: subcontractor } = await supabase
      .from('Subcontractor')
      .select('id, organizationId')
      .eq('userId', session.User.id)
      .single();

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subempreiteiro não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existingEntry = await verifyTimeEntryOwnership(
      supabase,
      id,
      subcontractor.id
    );

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Entrada de horas não encontrada' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Parse request body
    const body = await request.json();
    const { startTime, endTime, notes, workDate } = body;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Recalculate hours if times changed
    if (startTime !== undefined || endTime !== undefined) {
      const finalWorkDate = workDate || existingEntry.workDate;
      const finalStartTime = startTime || existingEntry.startTime;
      const finalEndTime = endTime || existingEntry.endTime;

      const start = new Date(`${finalWorkDate}T${finalStartTime}`);
      const end = new Date(`${finalWorkDate}T${finalEndTime}`);

      if (end <= start) {
        return NextResponse.json(
          { error: 'Horário final deve ser depois do inicial' },
          { status: 400, headers: corsHeaders }
        );
      }

      let hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      // Apply break policy (TODO: fetch from Subcontractor.breakPolicy)
      // For now, assume no break deduction

      hoursWorked = Math.max(0, hoursWorked);
      updateData.hoursWorked = hoursWorked;
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Update time entry
    const { data: timeEntry, error } = await supabase
      .from('TimeEntry')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating time entry:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar entrada de horas' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { timeEntry },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Update time entry error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar entrada de horas' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(
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

    // Get session and verify subcontractor
    const { data: session } = await supabase
      .from('Session')
      .select('*, User(*)')
      .eq('token', sessionToken)
      .single();

    if (!session || session.User.role !== 'subcontractor') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { data: subcontractor } = await supabase
      .from('Subcontractor')
      .select('id, organizationId')
      .eq('userId', session.User.id)
      .single();

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subempreiteiro não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existingEntry = await verifyTimeEntryOwnership(
      supabase,
      id,
      subcontractor.id
    );

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Entrada de horas não encontrada' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Hard delete (unlike employees, time entries can be removed)
    const { error } = await supabase
      .from('TimeEntry')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting time entry:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar entrada de horas' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Delete time entry error:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar entrada de horas' },
      { status: 500, headers: corsHeaders }
    );
  }
}

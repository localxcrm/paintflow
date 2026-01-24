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

async function getSubcontractorFromSession(sessionToken: string) {
  const supabase = createServerSupabaseClient();

  // Get session first
  const { data: session, error: sessionError } = await supabase
    .from('Session')
    .select('*')
    .eq('token', sessionToken)
    .single();

  if (sessionError || !session) {
    return { error: 'Sessão inválida', status: 401 };
  }

  if (new Date(session.expiresAt) < new Date()) {
    return { error: 'Sessão expirada', status: 401 };
  }

  // Get user separately
  const { data: user, error: userError } = await supabase
    .from('User')
    .select('*')
    .eq('id', session.userId)
    .single();

  if (userError || !user) {
    return { error: 'Usuário não encontrado', status: 401 };
  }

  if (user.role !== 'subcontractor') {
    return { error: 'Acesso não autorizado', status: 403 };
  }

  const { data: subcontractor } = await supabase
    .from('Subcontractor')
    .select('id, organizationId')
    .eq('userId', user.id)
    .single();

  if (!subcontractor) {
    return { error: 'Subempreiteiro não encontrado', status: 404 };
  }

  return { subcontractor };
}

async function verifyEmployeeOwnership(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  employeeId: string,
  subcontractorId: string,
  organizationId: string
) {
  const { data: employee } = await supabase
    .from('SubcontractorEmployee')
    .select('*')
    .eq('id', employeeId)
    .eq('subcontractorId', subcontractorId)
    .eq('organizationId', organizationId)
    .single();

  return employee;
}

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

    const result = await getSubcontractorFromSession(sessionToken);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: corsHeaders }
      );
    }

    const { subcontractor } = result;
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    // Verify employee belongs to this subcontractor
    const employee = await verifyEmployeeOwnership(
      supabase,
      id,
      subcontractor.id,
      subcontractor.organizationId
    );

    if (!employee) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { employee },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar funcionário' },
      { status: 500, headers: corsHeaders }
    );
  }
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

    const result = await getSubcontractorFromSession(sessionToken);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: corsHeaders }
      );
    }

    const { subcontractor } = result;
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    // Verify employee belongs to this subcontractor
    const existingEmployee = await verifyEmployeeOwnership(
      supabase,
      id,
      subcontractor.id,
      subcontractor.organizationId
    );

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, hourlyRate, ssn, phone, address, dateOfBirth, emergencyContact, isActive } = body;

    // Build update object with only fields that exist in schema
    const updateData: Record<string, unknown> = {};

    // Handle isActive (for restore functionality)
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Nome deve ter pelo menos 2 caracteres' },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.name = name.trim();
    }

    if (hourlyRate !== undefined) {
      if (typeof hourlyRate !== 'number' || hourlyRate <= 0) {
        return NextResponse.json(
          { error: 'Taxa horária deve ser maior que $0' },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.hourlyRate = hourlyRate;
    }

    // SSN format validation if provided
    if (ssn !== undefined && ssn !== null && typeof ssn === 'string') {
      const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
      if (!ssnRegex.test(ssn)) {
        return NextResponse.json(
          { error: 'Formato de SSN/ITIN inválido. Use: XXX-XX-XXXX' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date().toISOString();

    // Update employee
    const { data: employee, error: updateError } = await supabase
      .from('SubcontractorEmployee')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating employee:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar funcionário' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { employee },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar funcionário' },
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

    const result = await getSubcontractorFromSession(sessionToken);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: corsHeaders }
      );
    }

    const { subcontractor } = result;
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    // Verify employee belongs to this subcontractor
    const existingEmployee = await verifyEmployeeOwnership(
      supabase,
      id,
      subcontractor.id,
      subcontractor.organizationId
    );

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Soft delete: set isActive = false
    const { error: deleteError } = await supabase
      .from('SubcontractorEmployee')
      .update({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (deleteError) {
      console.error('Error archiving employee:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao arquivar funcionário' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { error: 'Erro ao arquivar funcionário' },
      { status: 500, headers: corsHeaders }
    );
  }
}

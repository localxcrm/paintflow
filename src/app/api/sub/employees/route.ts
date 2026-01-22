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

export async function GET() {
  try {
    const sessionToken = await getSubSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

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

    // Check if session expired
    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Sessão expirada' },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = session.User;

    // Verify it's a subcontractor
    if (user.role !== 'subcontractor') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get subcontractor data
    const { data: subcontractor } = await supabase
      .from('Subcontractor')
      .select('id, organizationId')
      .eq('userId', user.id)
      .single();

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subempreiteiro não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get all employees for this subcontractor
    const { data: employees, error: employeesError } = await supabase
      .from('SubcontractorEmployee')
      .select('*')
      .eq('subcontractorId', subcontractor.id)
      .eq('organizationId', subcontractor.organizationId)
      .order('name', { ascending: true });

    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      return NextResponse.json(
        { error: 'Erro ao buscar funcionários' },
        { status: 500, headers: corsHeaders }
      );
    }

    // TODO: Calculate stats (totalHours, totalEarned) from TimeEntry table
    // For now, return employees with zero stats
    const employeesWithStats = employees.map((emp: typeof employees[0]) => ({
      ...emp,
      totalHours: 0,
      totalEarned: 0,
    }));

    return NextResponse.json({
      employees: employeesWithStats,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar funcionários' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getSubSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

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

    const user = session.User;

    // Verify it's a subcontractor
    if (user.role !== 'subcontractor') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get subcontractor data
    const { data: subcontractor } = await supabase
      .from('Subcontractor')
      .select('id, organizationId')
      .eq('userId', user.id)
      .single();

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subempreiteiro não encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, hourlyRate, ssn, phone, address, dateOfBirth, emergencyContact, isOwner } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome é obrigatório e deve ter pelo menos 2 caracteres' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!hourlyRate || typeof hourlyRate !== 'number' || hourlyRate <= 0) {
      return NextResponse.json(
        { error: 'Taxa horária deve ser maior que $0' },
        { status: 400, headers: corsHeaders }
      );
    }

    // SSN format validation (XXX-XX-XXXX) if provided
    if (ssn && typeof ssn === 'string') {
      const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
      if (!ssnRegex.test(ssn)) {
        return NextResponse.json(
          { error: 'Formato de SSN/ITIN inválido. Use: XXX-XX-XXXX' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Insert employee (only store fields that exist in schema)
    const { data: employee, error: insertError } = await supabase
      .from('SubcontractorEmployee')
      .insert({
        subcontractorId: subcontractor.id,
        organizationId: subcontractor.organizationId,
        name: name.trim(),
        hourlyRate,
        isActive: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating employee:', insertError);
      return NextResponse.json(
        { error: 'Erro ao criar funcionário' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { employee },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar funcionário' },
      { status: 500, headers: corsHeaders }
    );
  }
}

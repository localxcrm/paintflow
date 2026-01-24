import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSubcontractor } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedSubcontractor();

    if (!auth) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { subcontractor, supabase } = auth;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = supabase
      .from('TimeEntry')
      .select(`
        id,
        workDate,
        hoursWorked,
        notes,
        jobId,
        employeeId,
        SubcontractorEmployee:SubcontractorEmployee (
          id,
          name,
          hourlyRate
        ),
        Job:Job (
          id,
          jobNumber,
          clientName
        )
      `)
      .eq('organizationId', subcontractor.organizationId);

    // Apply filters
    if (jobId) {
      query = query.eq('jobId', jobId);
    }

    if (employeeId) {
      // Verify employee belongs to this subcontractor
      const { data: employee } = await supabase
        .from('SubcontractorEmployee')
        .select('id')
        .eq('id', employeeId)
        .eq('subcontractorId', subcontractor.id)
        .single();

      if (!employee) {
        return NextResponse.json(
          { error: 'Funcionário não pertence a este subempreiteiro' },
          { status: 403, headers: corsHeaders }
        );
      }

      query = query.eq('employeeId', employeeId);
    } else {
      // Only show time entries for this sub's employees
      const { data: employees } = await supabase
        .from('SubcontractorEmployee')
        .select('id')
        .eq('subcontractorId', subcontractor.id);

      const employeeIds = employees?.map((e: { id: string }) => e.id) || [];
      if (employeeIds.length > 0) {
        query = query.in('employeeId', employeeIds);
      } else {
        // No employees, return empty
        return NextResponse.json(
          { timeEntries: [] },
          { headers: corsHeaders }
        );
      }
    }

    if (startDate) {
      query = query.gte('workDate', startDate);
    }

    if (endDate) {
      query = query.lte('workDate', endDate);
    }

    // Order by date descending
    query = query.order('workDate', { ascending: false });

    const { data: timeEntries, error } = await query;

    if (error) {
      console.error('Error fetching time entries:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar entradas de horas' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Transform to include laborCost
    const timeEntriesWithCost = timeEntries?.map((entry: any) => ({
      id: entry.id,
      workDate: entry.workDate,
      hoursWorked: entry.hoursWorked,
      notes: entry.notes,
      employee: {
        id: entry.SubcontractorEmployee.id,
        name: entry.SubcontractorEmployee.name,
        hourlyRate: entry.SubcontractorEmployee.hourlyRate,
        isOwner: false, // TODO: Add isOwner field to schema
      },
      job: {
        id: entry.Job.id,
        jobNumber: entry.Job.jobNumber,
        clientName: entry.Job.clientName,
      },
      laborCost: entry.hoursWorked * entry.SubcontractorEmployee.hourlyRate,
    })) || [];

    return NextResponse.json(
      { timeEntries: timeEntriesWithCost },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Get time entries error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar entradas de horas' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedSubcontractor();

    if (!auth) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { subcontractor, supabase } = auth;

    // Parse request body
    const body = await request.json();
    const { employeeId, jobId, workDate, startTime, endTime, notes } = body;

    // Validate required fields
    if (!employeeId || !jobId || !workDate || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: employeeId, jobId, workDate, startTime, endTime' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify employee belongs to this subcontractor
    const { data: employee } = await supabase
      .from('SubcontractorEmployee')
      .select('id')
      .eq('id', employeeId)
      .eq('subcontractorId', subcontractor.id)
      .single();

    if (!employee) {
      return NextResponse.json(
        { error: 'Funcionário não pertence a este subempreiteiro' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Verify job belongs to this subcontractor (check SubcontractorPayout)
    const { data: payout } = await supabase
      .from('SubcontractorPayout')
      .select('id')
      .eq('jobId', jobId)
      .eq('subcontractorId', subcontractor.id)
      .single();

    if (!payout) {
      return NextResponse.json(
        { error: 'Job não pertence a este subempreiteiro' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Calculate hours worked
    const start = new Date(`${workDate}T${startTime}`);
    const end = new Date(`${workDate}T${endTime}`);

    if (end <= start) {
      return NextResponse.json(
        { error: 'Horário final deve ser depois do inicial' },
        { status: 400, headers: corsHeaders }
      );
    }

    let hoursWorked = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Apply break policy (TODO: fetch from Subcontractor.breakPolicy)
    // For now, assume no break deduction
    // When schema is extended:
    // const { data: subSettings } = await supabase
    //   .from('Subcontractor')
    //   .select('breakPolicy')
    //   .eq('id', subcontractor.id)
    //   .single();
    //
    // if (subSettings?.breakPolicy === 'deduct30') {
    //   hoursWorked -= 0.5;
    // } else if (subSettings?.breakPolicy === 'deduct60') {
    //   hoursWorked -= 1;
    // }

    hoursWorked = Math.max(0, hoursWorked);

    // UPSERT to handle duplicate entries gracefully
    const { data: timeEntry, error } = await supabase
      .from('TimeEntry')
      .upsert(
        {
          employeeId,
          jobId,
          workDate,
          hoursWorked,
          notes: notes || null,
          organizationId: subcontractor.organizationId,
        },
        {
          onConflict: 'employeeId,jobId,workDate',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Time entry upsert error:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar entrada de horas' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { timeEntry },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Create time entry error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar entrada de horas' },
      { status: 500, headers: corsHeaders }
    );
  }
}

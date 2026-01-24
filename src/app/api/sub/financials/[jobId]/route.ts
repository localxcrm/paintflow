import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSubSessionToken } from '@/lib/auth';
import type { SubJobDetailResponse, SubJobFinancial, TimeEntryWithEmployee } from '@/types/sub-financial';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
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

    if (!session || !session.User || session.User.role !== 'subcontractor') {
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

    const { jobId } = await params;

    // Get payout for this job
    const { data: payout, error: payoutError } = await supabase
      .from('SubcontractorPayout')
      .select(`
        *,
        Job!inner (
          id,
          jobNumber,
          clientName,
          address,
          actualEndDate
        ),
        SubcontractorPayment (
          id,
          status,
          amount,
          paidDate
        )
      `)
      .eq('jobId', jobId)
      .eq('subcontractorId', subcontractor.id)
      .single();

    if (payoutError || !payout) {
      return NextResponse.json(
        { error: 'Job não encontrado ou não pertence a este subempreiteiro' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get time entries for this job
    const { data: employees } = await supabase
      .from('SubcontractorEmployee')
      .select('id')
      .eq('subcontractorId', subcontractor.id);

    const employeeIds = employees?.map((e: { id: string }) => e.id) || [];

    let timeEntries: TimeEntryWithEmployee[] = [];
    if (employeeIds.length > 0) {
      const { data } = await supabase
        .from('TimeEntry')
        .select(`
          id,
          workDate,
          hoursWorked,
          notes,
          SubcontractorEmployee!inner (
            id,
            name,
            hourlyRate
          ),
          Job!inner (
            id,
            jobNumber,
            clientName
          )
        `)
        .eq('jobId', jobId)
        .in('employeeId', employeeIds)
        .order('workDate', { ascending: false });

      timeEntries = data?.map((entry: any) => ({
        id: entry.id,
        workDate: entry.workDate,
        hoursWorked: entry.hoursWorked,
        notes: entry.notes,
        employee: {
          id: entry.SubcontractorEmployee.id,
          name: entry.SubcontractorEmployee.name,
          hourlyRate: entry.SubcontractorEmployee.hourlyRate,
          isOwner: false, // TODO: Add isOwner field
        },
        job: {
          id: entry.Job.id,
          jobNumber: entry.Job.jobNumber,
          clientName: entry.Job.clientName,
        },
        laborCost: entry.hoursWorked * entry.SubcontractorEmployee.hourlyRate,
      })) || [];
    }

    // Get material cost
    const { data: materialCostData } = await supabase
      .from('JobMaterialCost')
      .select('totalCost, notes')
      .eq('jobId', jobId)
      .eq('subcontractorId', subcontractor.id)
      .single();

    // Calculate labor cost
    const laborCost = timeEntries.reduce(
      (sum, te) => sum + te.laborCost,
      0
    );

    const materialCost = materialCostData?.totalCost || 0;
    const profit = payout.finalPayout - laborCost - materialCost;
    const profitMargin = payout.finalPayout > 0 ? (profit / payout.finalPayout) * 100 : 0;

    // Calculate payment status
    const payments = payout.SubcontractorPayment || [];
    const paidAmount = payments
      .filter((p: any) => p.status === 'paid')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    let paymentStatus: 'paid' | 'pending' | 'partial' = 'pending';
    if (paidAmount >= payout.finalPayout) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    }

    const job: SubJobFinancial = {
      jobId: payout.jobId,
      jobNumber: payout.Job.jobNumber,
      clientName: payout.Job.clientName,
      address: payout.Job.address,
      completedDate: payout.Job.actualEndDate,
      earnings: payout.finalPayout,
      laborCost,
      materialCost,
      profit,
      profitMargin,
      paymentStatus,
      ownerHours: null, // TODO: Calculate when isOwner field added
      effectiveRate: null,
    };

    const response: SubJobDetailResponse = {
      job,
      timeEntries,
      materialCost: materialCostData ? {
        totalCost: materialCostData.totalCost,
        notes: materialCostData.notes,
      } : null,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Get job financial detail error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do job' },
      { status: 500, headers: corsHeaders }
    );
  }
}

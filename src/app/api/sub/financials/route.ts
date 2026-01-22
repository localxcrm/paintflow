import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSubSessionToken } from '@/lib/auth';
import type { SubEarningsSummary, SubJobFinancial } from '@/types/sub-financial';

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

    // Get all payouts for this subcontractor
    const { data: payouts, error: payoutsError } = await supabase
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
      .eq('subcontractorId', subcontractor.id)
      .eq('organizationId', subcontractor.organizationId);

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError);
      return NextResponse.json(
        { error: 'Erro ao buscar ganhos' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Get time entries for labor cost calculation
    const { data: employees } = await supabase
      .from('SubcontractorEmployee')
      .select('id')
      .eq('subcontractorId', subcontractor.id);

    const employeeIds = employees?.map((e: { id: string }) => e.id) || [];

    let timeEntries: any[] = [];
    if (employeeIds.length > 0) {
      const { data } = await supabase
        .from('TimeEntry')
        .select(`
          id,
          jobId,
          hoursWorked,
          employeeId,
          SubcontractorEmployee!inner (
            id,
            hourlyRate
          )
        `)
        .in('employeeId', employeeIds);

      timeEntries = data || [];
    }

    // Get material costs
    const jobIds = payouts?.map((p: any) => p.jobId) || [];
    let materialCosts: any[] = [];

    if (jobIds.length > 0) {
      const { data } = await supabase
        .from('JobMaterialCost')
        .select('*')
        .in('jobId', jobIds)
        .eq('subcontractorId', subcontractor.id);

      materialCosts = data || [];
    }

    // Calculate summary and job list
    let totalEarnings = 0;
    let totalPending = 0;
    let totalPaid = 0;
    let totalOwnerHours = 0;
    const jobs: SubJobFinancial[] = [];

    for (const payout of payouts || []) {
      const jobTimeEntries = timeEntries.filter((te: any) => te.jobId === payout.jobId);
      const laborCost = jobTimeEntries.reduce(
        (sum: number, te: any) => sum + (te.hoursWorked * te.SubcontractorEmployee.hourlyRate),
        0
      );

      const materialCost = materialCosts.find((mc: any) => mc.jobId === payout.jobId)?.totalCost || 0;
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

      // Aggregate totals
      if (paymentStatus === 'paid') {
        totalEarnings += payout.finalPayout;
      } else {
        totalPending += payout.finalPayout;
      }

      totalPaid += paidAmount;

      // TODO: Calculate owner hours when isOwner field added
      const ownerHours = null; // jobTimeEntries.filter(te => te.isOwner).reduce(...)
      const effectiveRate = null; // ownerHours > 0 ? profit / ownerHours : null

      jobs.push({
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
        ownerHours,
        effectiveRate,
      });
    }

    const jobCount = jobs.length;
    const avgProfitPerJob = jobCount > 0 ? jobs.reduce((sum, j) => sum + j.profit, 0) / jobCount : 0;

    const summary: SubEarningsSummary = {
      totalEarnings,
      totalPending,
      totalPaid,
      jobCount,
      avgProfitPerJob,
      ownerHoursTotal: null, // TODO: Calculate when isOwner field added
      effectiveRateOverall: null,
    };

    return NextResponse.json(
      { summary, jobs },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Get financials error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados financeiros' },
      { status: 500, headers: corsHeaders }
    );
  }
}

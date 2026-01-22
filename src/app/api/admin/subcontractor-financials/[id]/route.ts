import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import type {
  SubcontractorFinancialDetailResponse,
  SubcontractorFinancialDetail,
  PayoutWithDetails,
  JobCostDetail,
  TimeEntryWithEmployee,
} from '@/types/financial';
import type {
  Subcontractor,
  SubcontractorPayout,
  SubcontractorPayment,
  Job,
  TimeEntry,
  SubcontractorEmployee,
  JobMaterialCost,
} from '@/types/database';

/**
 * GET /api/admin/subcontractor-financials/[id]
 *
 * Returns detailed financial data for a single subcontractor including:
 * - Subcontractor info
 * - All payouts with Job details and payments
 * - Cost breakdown (TimeEntry, JobMaterialCost) for each job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const orgId = getOrganizationIdFromRequest(request);
    const { id: subcontractorId } = await params;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Fetch subcontractor with all payouts, jobs, and payments
    const { data: subcontractor, error: subError } = await supabase
      .from('Subcontractor')
      .select(
        `
        *,
        SubcontractorPayout (
          *,
          Job (
            id,
            jobNumber,
            clientName,
            address,
            jobDate,
            status
          ),
          SubcontractorPayment (*)
        )
      `
      )
      .eq('id', subcontractorId)
      .eq('organizationId', orgId)
      .single();

    if (subError || !subcontractor) {
      return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
    }

    // Type assertion
    type SubWithPayouts = Subcontractor & {
      SubcontractorPayout: Array<
        SubcontractorPayout & {
          Job: Pick<Job, 'id' | 'jobNumber' | 'clientName' | 'address' | 'jobDate' | 'status'>;
          SubcontractorPayment: SubcontractorPayment[];
        }
      >;
    };

    const sub = subcontractor as SubWithPayouts;
    const payouts = sub.SubcontractorPayout || [];

    // Calculate financial totals
    const totalEarnings = payouts.reduce((sum, payout) => sum + (payout.finalPayout || 0), 0);
    const totalPaid = payouts.reduce((sum, payout) => {
      const payments = payout.SubcontractorPayment || [];
      return (
        sum +
        payments
          .filter((p) => p.status === 'paid')
          .reduce((paidSum, p) => paidSum + (p.amount || 0), 0)
      );
    }, 0);
    const pendingAmount = totalEarnings - totalPaid;

    // Build payouts array with Job details
    const payoutsWithDetails: PayoutWithDetails[] = payouts.map((payout) => ({
      ...payout,
      Job: payout.Job,
      SubcontractorPayment: payout.SubcontractorPayment || [],
    }));

    // Build SubcontractorFinancialDetail
    const subDetail: SubcontractorFinancialDetail = {
      ...sub,
      payouts: payoutsWithDetails,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
    };

    // Fetch cost details for each job
    const jobIds = payouts.map((p) => p.jobId);
    const jobCosts: Record<string, JobCostDetail> = {};

    if (jobIds.length > 0) {
      // Fetch time entries with employee details
      const { data: timeEntries } = await supabase
        .from('TimeEntry')
        .select(
          `
          *,
          SubcontractorEmployee (
            id,
            name,
            hourlyRate
          )
        `
        )
        .in('jobId', jobIds)
        .eq('organizationId', orgId);

      // Fetch material costs
      const { data: materialCosts } = await supabase
        .from('JobMaterialCost')
        .select('*')
        .in('jobId', jobIds)
        .eq('subcontractorId', subcontractorId)
        .eq('organizationId', orgId);

      // Type assertions
      type TimeEntryWithEmp = TimeEntry & {
        SubcontractorEmployee: Pick<SubcontractorEmployee, 'id' | 'name' | 'hourlyRate'>;
      };

      const timeEntriesTyped = (timeEntries || []) as TimeEntryWithEmp[];
      const materialCostsTyped = (materialCosts || []) as JobMaterialCost[];

      // Group by jobId
      for (const jobId of jobIds) {
        const jobTimeEntries = timeEntriesTyped.filter((te) => te.jobId === jobId);
        const jobMaterialCost = materialCostsTyped.find((mc) => mc.jobId === jobId) || null;

        // Calculate total labor cost
        const totalLaborCost = jobTimeEntries.reduce((sum, te) => {
          return sum + te.hoursWorked * te.SubcontractorEmployee.hourlyRate;
        }, 0);

        // Material cost
        const totalMaterialCost = jobMaterialCost?.totalCost || 0;

        jobCosts[jobId] = {
          jobId,
          timeEntries: jobTimeEntries as TimeEntryWithEmployee[],
          materialCost: jobMaterialCost,
          totalLaborCost: Math.round(totalLaborCost * 100) / 100,
          totalMaterialCost: Math.round(totalMaterialCost * 100) / 100,
        };
      }
    }

    const response: SubcontractorFinancialDetailResponse = {
      subcontractor: subDetail,
      jobCosts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SubcontractorFinancialDetail] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import type { SubcontractorFinancialsListResponse, SubcontractorFinancialSummary } from '@/types/financial';
import type { Subcontractor, SubcontractorPayout, SubcontractorPayment } from '@/types/database';

/**
 * GET /api/admin/subcontractor-financials
 *
 * Returns list of all subcontractors with aggregated financial data
 * for admin financial management dashboard (FIN-01, FIN-02)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const orgId = getOrganizationIdFromRequest(request);

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Fetch subcontractors with nested payouts and payments
    const { data: subcontractors, error } = await supabase
      .from('Subcontractor')
      .select(
        `
        id,
        name,
        companyName,
        email,
        defaultPayoutPct,
        isActive,
        SubcontractorPayout (
          id,
          finalPayout,
          SubcontractorPayment (
            id,
            amount,
            status
          )
        )
      `
      )
      .eq('organizationId', orgId)
      .order('name');

    if (error) {
      console.error('[SubcontractorFinancials] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch subcontractors' }, { status: 500 });
    }

    // Type assertion for nested data
    type SubcontractorWithPayouts = Subcontractor & {
      SubcontractorPayout: Array<
        SubcontractorPayout & {
          SubcontractorPayment: SubcontractorPayment[];
        }
      >;
    };

    const subs = (subcontractors || []) as SubcontractorWithPayouts[];

    // Aggregate financial data for each subcontractor
    const summaries: SubcontractorFinancialSummary[] = subs.map((sub) => {
      const payouts = sub.SubcontractorPayout || [];

      // Calculate total earnings (sum of all finalPayouts)
      const totalEarnings = payouts.reduce((sum, payout) => sum + (payout.finalPayout || 0), 0);

      // Calculate total paid (sum of all paid payments)
      const totalPaid = payouts.reduce((sum, payout) => {
        const payments = payout.SubcontractorPayment || [];
        const paidAmount = payments
          .filter((payment) => payment.status === 'paid')
          .reduce((paidSum, payment) => paidSum + (payment.amount || 0), 0);
        return sum + paidAmount;
      }, 0);

      // Calculate pending amount
      const pendingAmount = totalEarnings - totalPaid;

      // Count jobs completed (number of payouts)
      const jobsCompleted = payouts.length;

      return {
        id: sub.id,
        name: sub.name,
        companyName: sub.companyName,
        email: sub.email,
        defaultPayoutPct: sub.defaultPayoutPct,
        isActive: sub.isActive,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        jobsCompleted,
      };
    });

    const response: SubcontractorFinancialsListResponse = {
      subcontractors: summaries,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SubcontractorFinancials] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

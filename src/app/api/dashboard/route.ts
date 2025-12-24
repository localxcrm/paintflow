import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/dashboard - Get dashboard KPIs and summary data
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // week, month, quarter, year

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Fetch all necessary data in parallel
    const [
      leadsResult,
      estimatesResult,
      jobsResult,
      businessSettingsResult,
      marketingSpendResult,
      reviewsResult,
      overheadResult,
      monthlyTargetsResult,
    ] = await Promise.all([
      // Leads data
      supabase
        .from('Lead')
        .select('*')
        .gte('leadDate', startDate.toISOString()),
      // Estimates data
      supabase
        .from('Estimate')
        .select('*')
        .gte('estimateDate', startDate.toISOString()),
      // Jobs data (all for financial calculations)
      supabase
        .from('Job')
        .select('*')
        .gte('jobDate', startDate.toISOString()),
      // Business settings
      supabase
        .from('BusinessSettings')
        .select('*')
        .limit(1)
        .single(),
      // Marketing spend for the period
      supabase
        .from('MarketingSpend')
        .select('*')
        .eq('year', now.getFullYear()),
      // Reviews for the period
      supabase
        .from('Review')
        .select('*')
        .gte('reviewDate', startDate.toISOString()),
      // Overhead for the period
      supabase
        .from('OverheadExpense')
        .select('*')
        .eq('year', now.getFullYear()),
      // Monthly targets for comparison
      supabase
        .from('MonthlyTarget')
        .select('*')
        .eq('year', now.getFullYear())
        .eq('month', now.getMonth() + 1),
    ]);

    if (leadsResult.error) throw leadsResult.error;
    if (estimatesResult.error) throw estimatesResult.error;
    if (jobsResult.error) throw jobsResult.error;
    // BusinessSettings might not exist, so don't throw on PGRST116 (not found)
    if (businessSettingsResult.error && businessSettingsResult.error.code !== 'PGRST116') {
      throw businessSettingsResult.error;
    }

    const leads = leadsResult.data || [];
    const estimates = estimatesResult.data || [];
    const jobs = jobsResult.data || [];
    const businessSettings = businessSettingsResult.data;
    const marketingSpend = marketingSpendResult.data || [];
    const reviews = reviewsResult.data || [];
    const overhead = overheadResult.data || [];
    const monthlyTargets = monthlyTargetsResult.data || [];

    // Calculate Lead KPIs
    const totalLeads = leads.length;
    const leadsByStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const wonLeads = leadsByStatus['won'] || 0;
    const lostLeads = leadsByStatus['lost'] || 0;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    // Calculate Estimate KPIs
    const totalEstimates = estimates.length;
    const estimatesByStatus = estimates.reduce((acc, est) => {
      acc[est.status] = (acc[est.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const acceptedEstimates = estimatesByStatus['accepted'] || 0;
    const totalEstimateValue = estimates.reduce((sum, est) => sum + est.totalPrice, 0);
    const avgEstimateValue = totalEstimates > 0 ? totalEstimateValue / totalEstimates : 0;
    const estimateCloseRate = totalEstimates > 0 ? (acceptedEstimates / totalEstimates) * 100 : 0;

    // Calculate Job KPIs
    const totalJobs = jobs.length;
    const jobsByStatus = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const completedJobs = jobsByStatus['completed'] || 0;
    const scheduledJobs = jobsByStatus['scheduled'] || 0;

    // Financial KPIs
    const totalRevenue = jobs.reduce((sum, job) => sum + job.jobValue, 0);
    const totalGrossProfit = jobs.reduce((sum, job) => sum + job.grossProfit, 0);
    const avgGrossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    // Payment tracking
    const paidJobs = jobs.filter(job => job.jobPaid);
    const unpaidJobs = jobs.filter(job => !job.jobPaid);
    const totalCollected = paidJobs.reduce((sum, job) => sum + job.jobValue, 0);
    const totalOutstanding = unpaidJobs.reduce((sum, job) => sum + job.balanceDue, 0);
    const avgDaysToCollect = paidJobs.length > 0
      ? paidJobs.reduce((sum, job) => sum + (job.daysToCollect || 0), 0) / paidJobs.length
      : 0;

    // Commission tracking
    const unpaidSalesCommissions = jobs
      .filter(job => !job.salesCommissionPaid && job.salesCommissionAmount > 0)
      .reduce((sum, job) => sum + job.salesCommissionAmount, 0);
    const unpaidPmCommissions = jobs
      .filter(job => !job.pmCommissionPaid && job.pmCommissionAmount > 0)
      .reduce((sum, job) => sum + job.pmCommissionAmount, 0);
    const unpaidSubcontractors = jobs
      .filter(job => !job.subcontractorPaid && job.subcontractorPrice > 0)
      .reduce((sum, job) => sum + job.subcontractorPrice, 0);

    // Profit flags summary
    const jobsWithProfitIssues = jobs.filter(job => job.profitFlag !== 'OK');
    const profitFlagSummary = jobsWithProfitIssues.reduce((acc, job) => {
      acc[job.profitFlag] = (acc[job.profitFlag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Target comparisons
    const targetGrossMargin = businessSettings?.targetGrossMarginPct || 40;
    const targetARDays = businessSettings?.arTargetDays || 7;
    const minGrossProfit = businessSettings?.minGrossProfitPerJob || 900;

    // NEW: Marketing & Efficiency KPIs
    const totalMarketingSpend = marketingSpend.reduce((sum, spend) => sum + spend.amount, 0);
    const marketingBySource = marketingSpend.reduce((acc, spend) => {
      acc[spend.source] = (acc[spend.source] || 0) + spend.amount;
      return acc;
    }, {} as Record<string, number>);

    // Cost Per Lead (CPL)
    const cpl = totalLeads > 0 ? totalMarketingSpend / totalLeads : 0;

    // ROI (Return on Investment)
    const roi = totalMarketingSpend > 0 ? totalRevenue / totalMarketingSpend : 0;

    // Net Sales per Lead Index (NSLI)
    const nsli = totalLeads > 0 ? totalRevenue / totalLeads : 0;

    // Issue Rate (Estimates / Leads) - appointments that got proposals
    const issueRate = totalLeads > 0 ? (totalEstimates / totalLeads) * 100 : 0;

    // Demo Rate (proposals submitted / appointments)
    // Using estimate_scheduled leads as proxy for appointments
    const estimateScheduledLeads = leadsByStatus['estimate_scheduled'] || 0;
    const estimatedLeads = leadsByStatus['estimated'] || 0;
    const appointmentsRun = estimateScheduledLeads + estimatedLeads + wonLeads + lostLeads;
    const demoRate = appointmentsRun > 0 ? (totalEstimates / appointmentsRun) * 100 : 0;

    // Closing Rate (Sales / Proposals)
    const closingRate = totalEstimates > 0 ? (acceptedEstimates / totalEstimates) * 100 : 0;

    // Average Sale
    const avgSale = acceptedEstimates > 0
      ? estimates.filter(e => e.status === 'accepted').reduce((sum, e) => sum + e.totalPrice, 0) / acceptedEstimates
      : 0;

    // NEW: Review KPIs
    const totalReviews = reviews.length;
    const fiveStarReviews = reviews.filter(r => r.rating === 5).length;
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
    const reviewRate = completedJobs > 0 ? (totalReviews / completedJobs) * 100 : 0;
    const pria = appointmentsRun > 0 ? totalReviews / appointmentsRun : 0; // Reviews per appointment

    // NEW: Overhead & Net Profit
    const totalOverhead = overhead.reduce((sum, exp) => sum + exp.amount, 0);
    const overheadByCategory = overhead.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    // Total Commissions
    const totalSalesCommissions = jobs.reduce((sum, job) => sum + job.salesCommissionAmount, 0);
    const totalPmCommissions = jobs.reduce((sum, job) => sum + job.pmCommissionAmount, 0);
    const totalCommissions = totalSalesCommissions + totalPmCommissions;

    // Contribution Profit (Gross Profit - Commissions)
    const contributionProfit = totalGrossProfit - totalCommissions;
    const contributionMargin = totalRevenue > 0 ? (contributionProfit / totalRevenue) * 100 : 0;

    // Net Profit (Gross Profit - Commissions - Marketing - Overhead)
    const netProfit = totalGrossProfit - totalCommissions - totalMarketingSpend - totalOverhead;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // NEW: Goal Attainment (vs Monthly Targets)
    const currentTarget = monthlyTargets[0];
    const goalAttainment = currentTarget ? {
      leads: currentTarget.leadsGoal > 0 ? (totalLeads / currentTarget.leadsGoal) * 100 : 0,
      sales: currentTarget.salesGoal > 0 ? (acceptedEstimates / currentTarget.salesGoal) * 100 : 0,
      revenue: currentTarget.revenueGoal > 0 ? (totalRevenue / currentTarget.revenueGoal) * 100 : 0,
      grossProfit: currentTarget.grossProfitGoal > 0 ? (totalGrossProfit / currentTarget.grossProfitGoal) * 100 : 0,
      reviews: currentTarget.reviewsGoal > 0 ? (totalReviews / currentTarget.reviewsGoal) * 100 : 0,
    } : null;

    const dashboard = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      leads: {
        total: totalLeads,
        byStatus: leadsByStatus,
        won: wonLeads,
        lost: lostLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      estimates: {
        total: totalEstimates,
        byStatus: estimatesByStatus,
        accepted: acceptedEstimates,
        totalValue: Math.round(totalEstimateValue * 100) / 100,
        avgValue: Math.round(avgEstimateValue * 100) / 100,
        closeRate: Math.round(estimateCloseRate * 10) / 10,
      },
      jobs: {
        total: totalJobs,
        byStatus: jobsByStatus,
        completed: completedJobs,
        scheduled: scheduledJobs,
      },
      financials: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalGrossProfit: Math.round(totalGrossProfit * 100) / 100,
        avgGrossMargin: Math.round(avgGrossMargin * 10) / 10,
        targetGrossMargin,
        meetsTargetMargin: avgGrossMargin >= targetGrossMargin,
      },
      payments: {
        totalCollected: Math.round(totalCollected * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        avgDaysToCollect: Math.round(avgDaysToCollect * 10) / 10,
        targetARDays,
        meetsARTarget: avgDaysToCollect <= targetARDays,
      },
      commissions: {
        unpaidSales: Math.round(unpaidSalesCommissions * 100) / 100,
        unpaidPm: Math.round(unpaidPmCommissions * 100) / 100,
        unpaidSubcontractors: Math.round(unpaidSubcontractors * 100) / 100,
        totalUnpaid: Math.round((unpaidSalesCommissions + unpaidPmCommissions + unpaidSubcontractors) * 100) / 100,
      },
      profitFlags: {
        jobsWithIssues: jobsWithProfitIssues.length,
        summary: profitFlagSummary,
        minGrossProfit,
      },
      // NEW: Marketing Efficiency KPIs
      marketing: {
        totalSpend: Math.round(totalMarketingSpend * 100) / 100,
        bySource: marketingBySource,
        cpl: Math.round(cpl * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        roiFormatted: `${Math.round(roi * 10) / 10}:1`,
        percentOfRevenue: totalRevenue > 0 ? Math.round((totalMarketingSpend / totalRevenue) * 1000) / 10 : 0,
      },
      // NEW: Sales Funnel Efficiency
      salesFunnel: {
        leads: totalLeads,
        appointmentsRun,
        proposals: totalEstimates,
        sales: acceptedEstimates,
        issueRate: Math.round(issueRate * 10) / 10,
        demoRate: Math.round(demoRate * 10) / 10,
        closingRate: Math.round(closingRate * 10) / 10,
        nsli: Math.round(nsli * 100) / 100,
        avgSale: Math.round(avgSale * 100) / 100,
      },
      // NEW: Reviews & Reputation
      reviews: {
        total: totalReviews,
        fiveStarCount: fiveStarReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewRate: Math.round(reviewRate * 10) / 10,
        pria: Math.round(pria * 100) / 100,
        fiveStarPct: totalReviews > 0 ? Math.round((fiveStarReviews / totalReviews) * 1000) / 10 : 0,
      },
      // NEW: Full P&L Summary
      profitAndLoss: {
        revenue: Math.round(totalRevenue * 100) / 100,
        grossProfit: Math.round(totalGrossProfit * 100) / 100,
        grossMargin: Math.round(avgGrossMargin * 10) / 10,
        salesCommissions: Math.round(totalSalesCommissions * 100) / 100,
        pmCommissions: Math.round(totalPmCommissions * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        contributionProfit: Math.round(contributionProfit * 100) / 100,
        contributionMargin: Math.round(contributionMargin * 10) / 10,
        marketingSpend: Math.round(totalMarketingSpend * 100) / 100,
        overhead: Math.round(totalOverhead * 100) / 100,
        overheadByCategory,
        netProfit: Math.round(netProfit * 100) / 100,
        netMargin: Math.round(netMargin * 10) / 10,
      },
      // NEW: Goal Attainment
      goalAttainment: goalAttainment ? {
        leads: Math.round(goalAttainment.leads * 10) / 10,
        sales: Math.round(goalAttainment.sales * 10) / 10,
        revenue: Math.round(goalAttainment.revenue * 10) / 10,
        grossProfit: Math.round(goalAttainment.grossProfit * 10) / 10,
        reviews: Math.round(goalAttainment.reviews * 10) / 10,
        hasTargets: true,
      } : { hasTargets: false },
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}

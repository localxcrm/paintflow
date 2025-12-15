import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/dashboard - Get dashboard KPIs and summary data
export async function GET(request: NextRequest) {
  try {
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
      leads,
      estimates,
      jobs,
      businessSettings,
    ] = await Promise.all([
      // Leads data
      prisma.lead.findMany({
        where: {
          leadDate: { gte: startDate },
        },
      }),
      // Estimates data
      prisma.estimate.findMany({
        where: {
          estimateDate: { gte: startDate },
        },
      }),
      // Jobs data (all for financial calculations)
      prisma.job.findMany({
        where: {
          jobDate: { gte: startDate },
        },
      }),
      // Business settings
      prisma.businessSettings.findFirst(),
    ]);

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

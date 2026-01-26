import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import type { 
  ReportsResponse,
  RevenueReport,
  SubPerformanceReport,
  LeadSourceROIReport,
  DailyRevenue,
  SubPerformanceEntry,
  LeadSourceROI,
} from '@/types/reports';
import type { Job, Lead, Subcontractor, ProjectType } from '@/types/database';

// Extended Job type with payout
interface JobWithPayout extends Job {
  SubcontractorPayout?: {
    id: string;
    finalPayout: number;
    totalLaborCost: number;
    totalMaterialCost: number;
  } | null;
}

// Source labels for lead attribution
const SOURCE_LABELS: Record<string, string> = {
  google: 'Google Ads',
  facebook: 'Facebook',
  referral: 'Indicação',
  yard_sign: 'Placa',
  door_knock: 'Porta a Porta',
  repeat: 'Cliente Antigo',
  site: 'Website',
  other: 'Outros',
};

/**
 * Parse date string and validate
 */
function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Get previous period of same length
 */
function getPreviousPeriod(startDate: Date, endDate: Date): { start: Date; end: Date } {
  const diffMs = endDate.getTime() - startDate.getTime();
  const previousEnd = new Date(startDate.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - diffMs);
  return { start: previousStart, end: previousEnd };
}

/**
 * Calculate direction based on change
 */
function getDirection(current: number, previous: number): 'up' | 'down' | 'flat' {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}

// GET /api/reports - Get full reports data
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const orgId = getOrganizationIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Validate dates
    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    // Calculate previous period
    const previousPeriod = getPreviousPeriod(startDate, endDate);

    // Build organization filter helper
    const buildOrgQuery = <T>(query: ReturnType<typeof supabase.from<T>>) => {
      return orgId ? query.eq('organizationId', orgId) : query;
    };

    // Fetch all data in parallel
    const [
      currentJobsResult,
      previousJobsResult,
      currentLeadsResult,
      previousLeadsResult,
      subcontractorsResult,
      marketingSpendResult,
    ] = await Promise.all([
      // Current period jobs with payout data
      buildOrgQuery(supabase.from('Job').select(`
        *,
        SubcontractorPayout!left(
          id,
          finalPayout,
          totalLaborCost,
          totalMaterialCost
        )
      `))
        .gte('jobDate', startDate.toISOString())
        .lte('jobDate', endDate.toISOString()),

      // Previous period jobs
      buildOrgQuery(supabase.from('Job').select(`
        *,
        SubcontractorPayout!left(
          id,
          finalPayout,
          totalLaborCost,
          totalMaterialCost
        )
      `))
        .gte('jobDate', previousPeriod.start.toISOString())
        .lte('jobDate', previousPeriod.end.toISOString()),

      // Current period leads
      buildOrgQuery(supabase.from('Lead').select('*'))
        .gte('leadDate', startDate.toISOString())
        .lte('leadDate', endDate.toISOString()),

      // Previous period leads
      buildOrgQuery(supabase.from('Lead').select('*'))
        .gte('leadDate', previousPeriod.start.toISOString())
        .lte('leadDate', previousPeriod.end.toISOString()),

      // Subcontractors
      buildOrgQuery(supabase.from('Subcontractor').select('*')),

      // Marketing spend
      buildOrgQuery(supabase.from('MarketingSpend').select('*'))
        .gte('month', startDateStr.slice(0, 7))
        .lte('month', endDateStr.slice(0, 7)),
    ]);

    // Handle errors
    if (currentJobsResult.error) throw currentJobsResult.error;
    if (previousJobsResult.error) throw previousJobsResult.error;
    if (currentLeadsResult.error) throw currentLeadsResult.error;

    const currentJobs = (currentJobsResult.data || []) as JobWithPayout[];
    const previousJobs = (previousJobsResult.data || []) as JobWithPayout[];
    const currentLeads = (currentLeadsResult.data || []) as Lead[];
    const previousLeads = (previousLeadsResult.data || []) as Lead[];
    const subcontractors = (subcontractorsResult.data || []) as Subcontractor[];
    const marketingSpend = (marketingSpendResult.data || []) as { channel: string; amount: number; month: string }[];

    // =============================================
    // REVENUE REPORT
    // =============================================
    
    // Daily revenue aggregation
    const dailyRevenueMap: Record<string, { revenue: number; jobCount: number }> = {};
    for (const job of currentJobs) {
      const dateKey = new Date(job.jobDate).toISOString().split('T')[0];
      if (!dailyRevenueMap[dateKey]) {
        dailyRevenueMap[dateKey] = { revenue: 0, jobCount: 0 };
      }
      dailyRevenueMap[dateKey].revenue += job.jobValue || 0;
      dailyRevenueMap[dateKey].jobCount++;
    }

    const dailyData: DailyRevenue[] = Object.entries(dailyRevenueMap)
      .map(([date, data]) => ({ date, revenue: data.revenue, jobCount: data.jobCount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by project type
    const byProjectType = {
      interior: currentJobs.filter(j => j.projectType === 'interior').reduce((sum, j) => sum + (j.jobValue || 0), 0),
      exterior: currentJobs.filter(j => j.projectType === 'exterior').reduce((sum, j) => sum + (j.jobValue || 0), 0),
      both: currentJobs.filter(j => j.projectType === 'both').reduce((sum, j) => sum + (j.jobValue || 0), 0),
    };

    const currentTotalRevenue = currentJobs.reduce((sum, j) => sum + (j.jobValue || 0), 0);
    const previousTotalRevenue = previousJobs.reduce((sum, j) => sum + (j.jobValue || 0), 0);
    const currentCompleted = currentJobs.filter(j => j.status === 'completed').length;
    const previousCompleted = previousJobs.filter(j => j.status === 'completed').length;
    const currentAvgJob = currentJobs.length > 0 ? currentTotalRevenue / currentJobs.length : 0;
    const previousAvgJob = previousJobs.length > 0 ? previousTotalRevenue / previousJobs.length : 0;

    const revenueChange = previousTotalRevenue > 0 
      ? ((currentTotalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
      : (currentTotalRevenue > 0 ? 100 : 0);

    const revenueReport: RevenueReport = {
      totalRevenue: Math.round(currentTotalRevenue * 100) / 100,
      previousRevenue: Math.round(previousTotalRevenue * 100) / 100,
      percentChange: Math.round(revenueChange * 10) / 10,
      changeDirection: getDirection(currentTotalRevenue, previousTotalRevenue),
      dailyData,
      byProjectType,
      avgJobValue: Math.round(currentAvgJob * 100) / 100,
      previousAvgJobValue: Math.round(previousAvgJob * 100) / 100,
      jobsCompleted: currentCompleted,
      previousJobsCompleted: previousCompleted,
    };

    // =============================================
    // SUBCONTRACTOR PERFORMANCE REPORT
    // =============================================
    
    const subPerformanceEntries: SubPerformanceEntry[] = subcontractors.map(sub => {
      const subJobs = currentJobs.filter(j => j.subcontractorId === sub.id);
      const completedJobs = subJobs.filter(j => j.status === 'completed');
      const totalRevenue = subJobs.reduce((sum, j) => sum + (j.jobValue || 0), 0);
      const totalPayout = completedJobs.reduce((sum, j) => {
        const payout = j.SubcontractorPayout?.finalPayout || j.subcontractorPrice || 0;
        return sum + payout;
      }, 0);
      const totalProfit = completedJobs.reduce((sum, j) => {
        const revenue = j.jobValue || 0;
        const payout = j.SubcontractorPayout?.finalPayout || j.subcontractorPrice || 0;
        return sum + (revenue - payout);
      }, 0);
      
      // On-time calculation: jobs completed by scheduled end date
      const onTimeJobs = completedJobs.filter(j => {
        if (!j.scheduledEndDate || !j.actualEndDate) return true; // Assume on-time if no dates
        return new Date(j.actualEndDate) <= new Date(j.scheduledEndDate);
      });

      // Average days to complete
      const daysToComplete = completedJobs
        .filter(j => j.actualStartDate && j.actualEndDate)
        .map(j => {
          const start = new Date(j.actualStartDate!);
          const end = new Date(j.actualEndDate!);
          return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        });

      return {
        id: sub.id,
        name: sub.name,
        companyName: sub.companyName,
        specialty: sub.specialty || 'both',
        totalJobs: subJobs.length,
        completedJobs: completedJobs.length,
        completionRate: subJobs.length > 0 ? (completedJobs.length / subJobs.length) * 100 : 0,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPayout: Math.round(totalPayout * 100) / 100,
        avgProfitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        avgJobValue: subJobs.length > 0 ? totalRevenue / subJobs.length : 0,
        onTimeRate: completedJobs.length > 0 ? (onTimeJobs.length / completedJobs.length) * 100 : 100,
        avgDaysToComplete: daysToComplete.length > 0 
          ? daysToComplete.reduce((a, b) => a + b, 0) / daysToComplete.length 
          : 0,
        avgReviewScore: null, // TODO: Add reviews when available
        reviewCount: 0,
      };
    }).filter(s => s.totalJobs > 0);

    const activeSubs = subPerformanceEntries.filter(s => s.completedJobs > 0);
    const topPerformer = subPerformanceEntries
      .sort((a, b) => b.avgProfitMargin - a.avgProfitMargin)[0] || null;

    const subPerformanceReport: SubPerformanceReport = {
      dateRange: { startDate: startDateStr, endDate: endDateStr },
      subcontractors: subPerformanceEntries.sort((a, b) => b.totalRevenue - a.totalRevenue),
      summary: {
        totalSubcontractors: subcontractors.length,
        activeSubcontractors: activeSubs.length,
        avgCompletionRate: activeSubs.length > 0 
          ? activeSubs.reduce((sum, s) => sum + s.completionRate, 0) / activeSubs.length 
          : 0,
        avgProfitMargin: activeSubs.length > 0 
          ? activeSubs.reduce((sum, s) => sum + s.avgProfitMargin, 0) / activeSubs.length 
          : 0,
        avgOnTimeRate: activeSubs.length > 0 
          ? activeSubs.reduce((sum, s) => sum + s.onTimeRate, 0) / activeSubs.length 
          : 100,
        topPerformer,
      },
    };

    // =============================================
    // LEAD SOURCE ROI REPORT
    // =============================================
    
    // Group leads by source
    const sourceMap: Record<string, {
      leads: typeof currentLeads;
      jobs: typeof currentJobs;
    }> = {};

    for (const lead of currentLeads) {
      const source = lead.source || 'other';
      if (!sourceMap[source]) {
        sourceMap[source] = { leads: [], jobs: [] };
      }
      sourceMap[source].leads.push(lead);
    }

    // Match jobs to sources via leadId
    for (const job of currentJobs) {
      if (job.leadId) {
        const lead = currentLeads.find(l => l.id === job.leadId);
        if (lead) {
          const source = lead.source || 'other';
          if (sourceMap[source]) {
            sourceMap[source].jobs.push(job);
          }
        }
      } else if (job.leadSource) {
        // Fallback to job's leadSource field
        const source = job.leadSource;
        if (!sourceMap[source]) {
          sourceMap[source] = { leads: [], jobs: [] };
        }
        sourceMap[source].jobs.push(job);
      }
    }

    // Marketing spend by source
    const spendBySource: Record<string, number> = {};
    for (const spend of marketingSpend) {
      const source = spend.channel || 'other';
      spendBySource[source] = (spendBySource[source] || 0) + (spend.amount || 0);
    }

    const leadSourceROIs: LeadSourceROI[] = Object.entries(sourceMap).map(([source, data]) => {
      const totalLeads = data.leads.length;
      const convertedLeads = data.leads.filter(l => l.status === 'won').length;
      const totalRevenue = data.jobs.reduce((sum, j) => sum + (j.jobValue || 0), 0);
      const totalProfit = data.jobs.reduce((sum, j) => sum + (j.grossProfit || 0), 0);
      const marketingSpend = spendBySource[source] || 0;
      const roi = marketingSpend > 0 ? ((totalRevenue - marketingSpend) / marketingSpend) * 100 : 0;
      const costPerLead = totalLeads > 0 ? marketingSpend / totalLeads : 0;
      const costPerAcquisition = convertedLeads > 0 ? marketingSpend / convertedLeads : 0;

      return {
        source,
        label: SOURCE_LABELS[source] || source,
        totalLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        marketingSpend: Math.round(marketingSpend * 100) / 100,
        roi: Math.round(roi * 10) / 10,
        costPerLead: Math.round(costPerLead * 100) / 100,
        costPerAcquisition: Math.round(costPerAcquisition * 100) / 100,
        avgJobValue: data.jobs.length > 0 ? totalRevenue / data.jobs.length : 0,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    const totalMarketingSpend = Object.values(spendBySource).reduce((a, b) => a + b, 0);
    const totalROIRevenue = leadSourceROIs.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalROIProfit = leadSourceROIs.reduce((sum, s) => sum + s.totalProfit, 0);

    const leadSourceROIReport: LeadSourceROIReport = {
      dateRange: { startDate: startDateStr, endDate: endDateStr },
      sources: leadSourceROIs,
      summary: {
        totalMarketingSpend: Math.round(totalMarketingSpend * 100) / 100,
        totalRevenue: Math.round(totalROIRevenue * 100) / 100,
        totalProfit: Math.round(totalROIProfit * 100) / 100,
        overallROI: totalMarketingSpend > 0 
          ? Math.round(((totalROIRevenue - totalMarketingSpend) / totalMarketingSpend) * 1000) / 10 
          : 0,
        bestROISource: leadSourceROIs.sort((a, b) => b.roi - a.roi)[0] || null,
        bestConversionSource: leadSourceROIs.sort((a, b) => b.conversionRate - a.conversionRate)[0] || null,
      },
    };

    // =============================================
    // BUILD RESPONSE
    // =============================================

    const response: ReportsResponse = {
      generatedAt: new Date().toISOString(),
      dateRange: { startDate: startDateStr, endDate: endDateStr },
      comparisonRange: { 
        startDate: previousPeriod.start.toISOString().split('T')[0],
        endDate: previousPeriod.end.toISOString().split('T')[0],
      },
      revenue: revenueReport,
      subPerformance: subPerformanceReport,
      leadSourceROI: leadSourceROIReport,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}

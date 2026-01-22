import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import type {
  KPIResponse,
  KPIPeriod,
  KPIMetric,
  TrendDataPoint,
  LeadPipelineData,
  LeadSourceData,
  SubcontractorRankEntry,
} from '@/types/kpi';
import type { Job, Lead, LeadEvent, Subcontractor, LeadStatus } from '@/types/database';

// Lead status pipeline order for display
const LEAD_PIPELINE_ORDER: { stage: LeadStatus; label: string }[] = [
  { stage: 'new', label: 'Novo' },
  { stage: 'contacted', label: 'Contatado' },
  { stage: 'estimate_scheduled', label: 'Estimativa Agendada' },
  { stage: 'estimated', label: 'Estimado' },
  { stage: 'proposal_sent', label: 'Proposta Enviada' },
  { stage: 'follow_up', label: 'Follow Up' },
  { stage: 'won', label: 'Ganho' },
  { stage: 'lost', label: 'Perdido' },
];

// Source labels for lead attribution
const SOURCE_LABELS: Record<string, string> = {
  google: 'Google Ads',
  facebook: 'Facebook',
  referral: 'Indicacao',
  yard_sign: 'Placa',
  door_knock: 'Porta a Porta',
  repeat: 'Cliente Antigo',
  site: 'Website',
  other: 'Outros',
};

/**
 * Calculate date ranges for current and previous periods
 */
function getDateRanges(period: KPIPeriod): {
  current: { start: Date; end: Date };
  previous: { start: Date; end: Date };
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'week': {
      // Current: last 7 days (including today)
      const currentStart = new Date(today);
      currentStart.setDate(currentStart.getDate() - 6);
      const currentEnd = new Date(today);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous: 7 days before that
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
      const previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);

      return {
        current: { start: currentStart, end: currentEnd },
        previous: { start: previousStart, end: previousEnd },
      };
    }

    case 'month': {
      // Current: current calendar month
      const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentEnd = new Date(today);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous: previous calendar month
      const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      previousEnd.setHours(23, 59, 59, 999);

      return {
        current: { start: currentStart, end: currentEnd },
        previous: { start: previousStart, end: previousEnd },
      };
    }

    case 'quarter': {
      // Current: last 90 days
      const currentStart = new Date(today);
      currentStart.setDate(currentStart.getDate() - 89);
      const currentEnd = new Date(today);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous: 90 days before that
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 90);
      const previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);

      return {
        current: { start: currentStart, end: currentEnd },
        previous: { start: previousStart, end: previousEnd },
      };
    }

    case 'year': {
      // Current: YTD (Jan 1 to today)
      const currentStart = new Date(now.getFullYear(), 0, 1);
      const currentEnd = new Date(today);
      currentEnd.setHours(23, 59, 59, 999);

      // Previous: Same period last year
      const previousStart = new Date(now.getFullYear() - 1, 0, 1);
      const previousEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      previousEnd.setHours(23, 59, 59, 999);

      return {
        current: { start: currentStart, end: currentEnd },
        previous: { start: previousStart, end: previousEnd },
      };
    }

    default:
      // Default to month
      return getDateRanges('month');
  }
}

/**
 * Calculate delta percentage and direction
 */
function calculateDelta(current: number, previous: number): { delta: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) {
    if (current === 0) {
      return { delta: 0, direction: 'flat' };
    }
    return { delta: 100, direction: 'up' };
  }

  const delta = ((current - previous) / previous) * 100;
  const roundedDelta = Math.round(delta * 10) / 10;

  return {
    delta: roundedDelta,
    direction: roundedDelta > 0 ? 'up' : roundedDelta < 0 ? 'down' : 'flat',
  };
}

/**
 * Generate trend data points by grouping data by date
 */
function generateTrendData(
  jobs: (Job & { SubcontractorPayout?: { finalPayout: number } | null })[],
  startDate: Date,
  endDate: Date,
  valueExtractor: (job: Job & { SubcontractorPayout?: { finalPayout: number } | null }) => number,
  period: KPIPeriod
): TrendDataPoint[] {
  const trend: TrendDataPoint[] = [];
  const dayMs = 24 * 60 * 60 * 1000;

  // Determine grouping interval based on period
  const interval = period === 'year' ? 7 : 1; // Weekly for year, daily otherwise

  // Create date buckets
  const buckets: Map<string, number> = new Map();
  let current = new Date(startDate);

  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    buckets.set(dateKey, 0);
    current = new Date(current.getTime() + interval * dayMs);
  }

  // Fill buckets with job data
  for (const job of jobs) {
    const jobDate = new Date(job.jobDate).toISOString().split('T')[0];
    if (buckets.has(jobDate)) {
      buckets.set(jobDate, (buckets.get(jobDate) || 0) + valueExtractor(job));
    } else {
      // Find the nearest bucket for this date
      const nearest = Array.from(buckets.keys()).reduce((closest, key) => {
        const keyDate = new Date(key);
        const jobDateObj = new Date(jobDate);
        const closestDate = new Date(closest);
        return Math.abs(keyDate.getTime() - jobDateObj.getTime()) <
          Math.abs(closestDate.getTime() - jobDateObj.getTime())
          ? key
          : closest;
      });
      if (nearest) {
        buckets.set(nearest, (buckets.get(nearest) || 0) + valueExtractor(job));
      }
    }
  }

  // Convert to trend data points, limit to 30 points max
  const entries = Array.from(buckets.entries()).slice(-30);
  for (const [date, value] of entries) {
    trend.push({ date, value: Math.round(value * 100) / 100 });
  }

  return trend;
}

/**
 * Generate lead trend data
 */
function generateLeadTrendData(
  leads: Lead[],
  startDate: Date,
  endDate: Date,
  period: KPIPeriod
): TrendDataPoint[] {
  const trend: TrendDataPoint[] = [];
  const dayMs = 24 * 60 * 60 * 1000;

  const interval = period === 'year' ? 7 : 1;

  const buckets: Map<string, number> = new Map();
  let current = new Date(startDate);

  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    buckets.set(dateKey, 0);
    current = new Date(current.getTime() + interval * dayMs);
  }

  for (const lead of leads) {
    const leadDate = new Date(lead.leadDate).toISOString().split('T')[0];
    if (buckets.has(leadDate)) {
      buckets.set(leadDate, (buckets.get(leadDate) || 0) + 1);
    }
  }

  const entries = Array.from(buckets.entries()).slice(-30);
  for (const [date, value] of entries) {
    trend.push({ date, value });
  }

  return trend;
}

/**
 * Get actual profit from payout if available, otherwise fall back to estimated grossProfit
 */
function getActualProfit(job: Job & { SubcontractorPayout?: { finalPayout: number } | null }): number {
  return job.SubcontractorPayout?.finalPayout ?? job.grossProfit ?? 0;
}

// GET /api/kpis - Get KPI dashboard data with period comparison
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const orgId = getOrganizationIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as KPIPeriod) || 'month';

    // Validate period
    if (!['week', 'month', 'quarter', 'year'].includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    // Calculate date ranges
    const dateRanges = getDateRanges(period);

    // Build organization filter
    const buildOrgQuery = <T>(query: ReturnType<typeof supabase.from<T>>) => {
      return orgId ? query.eq('organizationId', orgId) : query;
    };

    // Fetch all data in parallel
    const [
      currentJobsResult,
      previousJobsResult,
      currentLeadsResult,
      previousLeadsResult,
      leadEventsResult,
      subcontractorsResult,
      reviewsResult,
    ] = await Promise.all([
      // Current period jobs
      buildOrgQuery(supabase.from<Job>('Job').select(`
        *,
        SubcontractorPayout!left(
          id,
          finalPayout,
          totalLaborCost,
          totalMaterialCost
        )
      `))
        .gte('jobDate', dateRanges.current.start.toISOString())
        .lte('jobDate', dateRanges.current.end.toISOString()),

      // Previous period jobs
      buildOrgQuery(supabase.from<Job>('Job').select(`
        *,
        SubcontractorPayout!left(
          id,
          finalPayout,
          totalLaborCost,
          totalMaterialCost
        )
      `))
        .gte('jobDate', dateRanges.previous.start.toISOString())
        .lte('jobDate', dateRanges.previous.end.toISOString()),

      // Current period leads
      buildOrgQuery(supabase.from<Lead>('Lead').select('*'))
        .gte('leadDate', dateRanges.current.start.toISOString())
        .lte('leadDate', dateRanges.current.end.toISOString()),

      // Previous period leads
      buildOrgQuery(supabase.from<Lead>('Lead').select('*'))
        .gte('leadDate', dateRanges.previous.start.toISOString())
        .lte('leadDate', dateRanges.previous.end.toISOString()),

      // Lead events for source attribution (current period)
      buildOrgQuery(supabase.from<LeadEvent>('LeadEvent').select('*'))
        .gte('createdAt', dateRanges.current.start.toISOString())
        .lte('createdAt', dateRanges.current.end.toISOString()),

      // Subcontractors with active status
      buildOrgQuery(supabase.from<Subcontractor>('Subcontractor').select('*'))
        .eq('isActive', true),

      // Reviews for subcontractor ranking (all time to calculate averages)
      supabase.from('Review').select('*'),
    ]);

    // Handle errors
    if (currentJobsResult.error) throw currentJobsResult.error;
    if (previousJobsResult.error) throw previousJobsResult.error;
    if (currentLeadsResult.error) throw currentLeadsResult.error;
    if (previousLeadsResult.error) throw previousLeadsResult.error;

    const currentJobs = (currentJobsResult.data || []) as Job[];
    const previousJobs = (previousJobsResult.data || []) as Job[];
    const currentLeads = (currentLeadsResult.data || []) as Lead[];
    const previousLeads = (previousLeadsResult.data || []) as Lead[];
    const leadEvents = (leadEventsResult.data || []) as LeadEvent[];
    const subcontractors = (subcontractorsResult.data || []) as Subcontractor[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews = (reviewsResult.data || []) as any[];

    // Calculate hero metrics

    // Revenue
    const currentRevenue = currentJobs.reduce((sum, job) => sum + (job.jobValue || 0), 0);
    const previousRevenue = previousJobs.reduce((sum, job) => sum + (job.jobValue || 0), 0);
    const revenueDelta = calculateDelta(currentRevenue, previousRevenue);
    const revenueMetric: KPIMetric = {
      current: Math.round(currentRevenue * 100) / 100,
      previous: Math.round(previousRevenue * 100) / 100,
      delta: revenueDelta.delta,
      deltaDirection: revenueDelta.direction,
      trend: generateTrendData(currentJobs, dateRanges.current.start, dateRanges.current.end, (j) => j.jobValue || 0, period),
    };

    // Gross Profit
    const currentProfit = currentJobs.reduce((sum, job) => sum + getActualProfit(job), 0);
    const previousProfit = previousJobs.reduce((sum, job) => sum + getActualProfit(job), 0);
    const profitDelta = calculateDelta(currentProfit, previousProfit);
    const grossProfitMetric: KPIMetric = {
      current: Math.round(currentProfit * 100) / 100,
      previous: Math.round(previousProfit * 100) / 100,
      delta: profitDelta.delta,
      deltaDirection: profitDelta.direction,
      trend: generateTrendData(currentJobs, dateRanges.current.start, dateRanges.current.end, getActualProfit, period),
    };

    // Gross Margin (percentage)
    const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
    const previousMargin = previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0;
    const marginDelta = calculateDelta(currentMargin, previousMargin);
    const grossMarginMetric: KPIMetric = {
      current: Math.round(currentMargin * 10) / 10,
      previous: Math.round(previousMargin * 10) / 10,
      delta: marginDelta.delta,
      deltaDirection: marginDelta.direction,
      trend: [], // Margin trend calculated per period doesn't make sense as daily
    };

    // Secondary metrics

    // Leads
    const currentLeadsCount = currentLeads.length;
    const previousLeadsCount = previousLeads.length;
    const leadsDelta = calculateDelta(currentLeadsCount, previousLeadsCount);
    const leadsMetric: KPIMetric = {
      current: currentLeadsCount,
      previous: previousLeadsCount,
      delta: leadsDelta.delta,
      deltaDirection: leadsDelta.direction,
      trend: generateLeadTrendData(currentLeads, dateRanges.current.start, dateRanges.current.end, period),
    };

    // Conversion Rate
    const currentWon = currentLeads.filter((l) => l.status === 'won').length;
    const previousWon = previousLeads.filter((l) => l.status === 'won').length;
    const currentConversion = currentLeadsCount > 0 ? (currentWon / currentLeadsCount) * 100 : 0;
    const previousConversion = previousLeadsCount > 0 ? (previousWon / previousLeadsCount) * 100 : 0;
    const conversionDelta = calculateDelta(currentConversion, previousConversion);
    const conversionRateMetric: KPIMetric = {
      current: Math.round(currentConversion * 10) / 10,
      previous: Math.round(previousConversion * 10) / 10,
      delta: conversionDelta.delta,
      deltaDirection: conversionDelta.direction,
      trend: [], // Conversion rate trend per day doesn't make sense
    };

    // Jobs Completed
    const currentCompleted = currentJobs.filter((j) => j.status === 'completed').length;
    const previousCompleted = previousJobs.filter((j) => j.status === 'completed').length;
    const completedDelta = calculateDelta(currentCompleted, previousCompleted);
    const jobsCompletedMetric: KPIMetric = {
      current: currentCompleted,
      previous: previousCompleted,
      delta: completedDelta.delta,
      deltaDirection: completedDelta.direction,
      trend: generateTrendData(
        currentJobs.filter((j) => j.status === 'completed'),
        dateRanges.current.start,
        dateRanges.current.end,
        () => 1,
        period
      ),
    };

    // Average Job Value
    const currentAvgValue = currentJobs.length > 0 ? currentRevenue / currentJobs.length : 0;
    const previousAvgValue = previousJobs.length > 0 ? previousRevenue / previousJobs.length : 0;
    const avgValueDelta = calculateDelta(currentAvgValue, previousAvgValue);
    const avgJobValueMetric: KPIMetric = {
      current: Math.round(currentAvgValue * 100) / 100,
      previous: Math.round(previousAvgValue * 100) / 100,
      delta: avgValueDelta.delta,
      deltaDirection: avgValueDelta.direction,
      trend: [], // Avg value trend doesn't make sense daily
    };

    // Lead Pipeline
    const leadPipeline: LeadPipelineData[] = LEAD_PIPELINE_ORDER.map(({ stage, label }) => {
      const stageLeads = currentLeads.filter((l) => l.status === stage);
      return {
        stage,
        label,
        count: stageLeads.length,
        value: stageLeads.reduce((sum, l) => sum + (l.estimatedJobValue || 0), 0),
      };
    });

    // Lead Sources Attribution
    const sourceCountMap: Record<string, number> = {};
    for (const event of leadEvents) {
      if (event.eventType === 'lead_created' && event.channel) {
        sourceCountMap[event.channel] = (sourceCountMap[event.channel] || 0) + 1;
      }
    }

    // Also count from Lead.source if no events
    if (Object.keys(sourceCountMap).length === 0) {
      for (const lead of currentLeads) {
        if (lead.source) {
          sourceCountMap[lead.source] = (sourceCountMap[lead.source] || 0) + 1;
        }
      }
    }

    const totalSourceLeads = Object.values(sourceCountMap).reduce((sum, count) => sum + count, 0);
    const leadSources: LeadSourceData[] = Object.entries(sourceCountMap)
      .map(([source, count]) => ({
        source,
        label: SOURCE_LABELS[source] || source,
        count,
        percentage: totalSourceLeads > 0 ? Math.round((count / totalSourceLeads) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Subcontractor Ranking
    // Group jobs by subcontractor
    const subJobMap: Record<string, { completed: number; revenue: number }> = {};
    for (const job of currentJobs) {
      if (job.subcontractorId && job.status === 'completed') {
        if (!subJobMap[job.subcontractorId]) {
          subJobMap[job.subcontractorId] = { completed: 0, revenue: 0 };
        }
        subJobMap[job.subcontractorId].completed++;
        subJobMap[job.subcontractorId].revenue += job.jobValue || 0;
      }
    }

    // Group reviews by subcontractor (if review table has subcontractorId)
    const subReviewMap: Record<string, { total: number; count: number }> = {};
    for (const review of reviews) {
      const subId = review.subcontractorId;
      if (subId) {
        if (!subReviewMap[subId]) {
          subReviewMap[subId] = { total: 0, count: 0 };
        }
        subReviewMap[subId].total += review.rating || 0;
        subReviewMap[subId].count++;
      }
    }

    const subcontractorRanking: SubcontractorRankEntry[] = subcontractors
      .map((sub) => {
        const jobData = subJobMap[sub.id] || { completed: 0, revenue: 0 };
        const reviewData = subReviewMap[sub.id];
        return {
          id: sub.id,
          name: sub.name,
          companyName: sub.companyName,
          jobsCompleted: jobData.completed,
          totalRevenue: Math.round(jobData.revenue * 100) / 100,
          avgReviewScore: reviewData ? Math.round((reviewData.total / reviewData.count) * 10) / 10 : null,
          reviewCount: reviewData?.count || 0,
        };
      })
      .filter((s) => s.jobsCompleted > 0 || s.reviewCount > 0)
      .sort((a, b) => b.reviewCount - a.reviewCount || b.jobsCompleted - a.jobsCompleted)
      .slice(0, 5);

    // Build response
    const response: KPIResponse = {
      period,
      dateRange: {
        current: {
          start: dateRanges.current.start.toISOString(),
          end: dateRanges.current.end.toISOString(),
        },
        previous: {
          start: dateRanges.previous.start.toISOString(),
          end: dateRanges.previous.end.toISOString(),
        },
      },
      updatedAt: new Date().toISOString(),

      // Hero metrics
      revenue: revenueMetric,
      grossProfit: grossProfitMetric,
      grossMargin: grossMarginMetric,

      // Secondary metrics
      leads: leadsMetric,
      conversionRate: conversionRateMetric,
      jobsCompleted: jobsCompletedMetric,
      avgJobValue: avgJobValueMetric,

      // Pipeline and attribution
      leadPipeline,
      leadSources,

      // Subcontractor ranking
      subcontractorRanking,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}

// KPI Calculation Utilities for Multi-tenant SaaS
import { supabaseAdmin } from './supabase';
import type {
  KpiSummary,
  KpiWithTarget,
  MonthlyTarget,
  DailyTarget,
  DailyKpi,
  Target,
  Seasonality,
  GhlLead,
} from '@/types/database';

// ============================================
// HELPER FUNCTIONS
// ============================================

function getMonthName(month: number): string {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  return months[month - 1] || 'january';
}

function getBusinessDaysInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  let businessDays = 0;

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      businessDays++;
    }
  }

  return businessDays || 22; // Default to 22 if something goes wrong
}

function getStatus(achievement: number): 'on_track' | 'at_risk' | 'behind' {
  if (achievement >= 90) return 'on_track';
  if (achievement >= 70) return 'at_risk';
  return 'behind';
}

// ============================================
// SEASONALITY FUNCTIONS
// ============================================

export async function getSeasonality(tenantId: string, year: number): Promise<Seasonality | null> {
  const { data, error } = await supabaseAdmin
    .from('Seasonality')
    .select('*')
    .eq('tenantId', tenantId)
    .eq('year', year)
    .single();

  if (error || !data) {
    // Return default seasonality (equal distribution)
    return null;
  }

  return data as Seasonality;
}

export function getMonthPercentage(seasonality: Seasonality | null, month: number): number {
  if (!seasonality) {
    return 8.33; // Default equal distribution (100/12)
  }

  const monthName = getMonthName(month) as keyof Seasonality;
  const value = seasonality[monthName];

  return typeof value === 'number' ? value : 8.33;
}

// ============================================
// TARGET FUNCTIONS
// ============================================

export async function getAnnualTarget(tenantId: string, year: number): Promise<Target | null> {
  const { data, error } = await supabaseAdmin
    .from('Target')
    .select('*')
    .eq('tenantId', tenantId)
    .eq('year', year)
    .eq('periodType', 'annual')
    .single();

  if (error || !data) {
    return null;
  }

  return data as Target;
}

export async function getMonthlyTarget(
  tenantId: string,
  year: number,
  month: number
): Promise<MonthlyTarget> {
  const [annualTarget, seasonality] = await Promise.all([
    getAnnualTarget(tenantId, year),
    getSeasonality(tenantId, year),
  ]);

  if (!annualTarget) {
    return {
      revenueTarget: 0,
      leadsTarget: 0,
      jobsTarget: 0,
    };
  }

  const monthPct = getMonthPercentage(seasonality, month) / 100;

  return {
    revenueTarget: annualTarget.revenueTarget * monthPct,
    leadsTarget: Math.round(annualTarget.leadsTarget * monthPct),
    jobsTarget: Math.round(annualTarget.jobsTarget * monthPct),
  };
}

export async function getDailyTarget(
  tenantId: string,
  date: Date
): Promise<DailyTarget> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const monthlyTarget = await getMonthlyTarget(tenantId, year, month);
  const businessDays = getBusinessDaysInMonth(year, month);

  return {
    revenueTarget: monthlyTarget.revenueTarget / businessDays,
    leadsTarget: monthlyTarget.leadsTarget / businessDays,
    jobsTarget: monthlyTarget.jobsTarget / businessDays,
  };
}

// ============================================
// KPI CALCULATION FUNCTIONS
// ============================================

export async function calculateKpiSummary(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<KpiSummary> {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Fetch leads data
  const { data: leads, error: leadsError } = await supabaseAdmin
    .from('GhlLead')
    .select('*')
    .eq('tenantId', tenantId)
    .gte('createdAt', startStr)
    .lte('createdAt', endStr + 'T23:59:59');

  if (leadsError) {
    console.error('Error fetching leads for KPI:', leadsError);
  }

  const leadsList = (leads || []) as GhlLead[];

  // Fetch marketing spend
  const { data: spendData, error: spendError } = await supabaseAdmin
    .from('CampaignSpend')
    .select('spend')
    .eq('tenantId', tenantId)
    .gte('date', startStr)
    .lte('date', endStr);

  if (spendError) {
    console.error('Error fetching spend for KPI:', spendError);
  }

  const totalSpend = (spendData || []).reduce((sum: number, s: { spend?: number }) => sum + (s.spend || 0), 0);

  // Calculate metrics
  const leadsTotal = leadsList.length;
  const leadsNew = leadsList.filter(l => l.status === 'new').length;
  const leadsContacted = leadsList.filter(l => l.status === 'contacted').length;
  const leadsQualified = leadsList.filter(l => l.status === 'qualified').length;

  const estimatesScheduled = leadsList.filter(l => l.status === 'estimate_scheduled').length;
  const estimatesSent = leadsList.filter(l => l.estimateSentAt !== null).length;
  const estimatesAccepted = leadsList.filter(l => l.status === 'won').length;
  const estimatesDeclined = leadsList.filter(l => l.status === 'lost').length;

  const wonLeads = leadsList.filter(l => l.status === 'won');
  const lostLeads = leadsList.filter(l => l.status === 'lost');

  const jobsWon = wonLeads.length;
  const jobsLost = lostLeads.length;
  const revenueWon = wonLeads.reduce((sum, l) => sum + (l.actualValue || l.monetaryValue || 0), 0);
  const revenueLost = lostLeads.reduce((sum, l) => sum + (l.estimatedValue || l.monetaryValue || 0), 0);

  // Calculate rates
  const closeRate = (jobsWon + jobsLost) > 0
    ? (jobsWon / (jobsWon + jobsLost)) * 100
    : null;

  const conversionRate = leadsTotal > 0
    ? (jobsWon / leadsTotal) * 100
    : null;

  const cpl = leadsTotal > 0 && totalSpend > 0
    ? totalSpend / leadsTotal
    : null;

  const cac = jobsWon > 0 && totalSpend > 0
    ? totalSpend / jobsWon
    : null;

  const averageTicket = jobsWon > 0
    ? revenueWon / jobsWon
    : null;

  return {
    leadsTotal,
    leadsNew,
    leadsContacted,
    leadsQualified,
    estimatesScheduled,
    estimatesSent,
    estimatesAccepted,
    estimatesDeclined,
    jobsWon,
    jobsLost,
    revenueWon,
    revenueLost,
    marketingSpend: totalSpend,
    cpl,
    cac,
    closeRate,
    conversionRate,
    averageTicket,
  };
}

export async function calculateKpiWithTarget(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  targetType: 'monthly' | 'ytd' = 'monthly'
): Promise<KpiWithTarget> {
  const kpiSummary = await calculateKpiSummary(tenantId, startDate, endDate);

  let target: MonthlyTarget;

  if (targetType === 'ytd') {
    // Year-to-date: get annual target prorated to current date
    const year = endDate.getFullYear();
    const annualTarget = await getAnnualTarget(tenantId, year);

    if (annualTarget) {
      const dayOfYear = Math.floor((endDate.getTime() - new Date(year, 0, 1).getTime()) / (24 * 60 * 60 * 1000)) + 1;
      const daysInYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
      const yearProgress = dayOfYear / daysInYear;

      target = {
        revenueTarget: annualTarget.revenueTarget * yearProgress,
        leadsTarget: Math.round(annualTarget.leadsTarget * yearProgress),
        jobsTarget: Math.round(annualTarget.jobsTarget * yearProgress),
      };
    } else {
      target = { revenueTarget: 0, leadsTarget: 0, jobsTarget: 0 };
    }
  } else {
    // Monthly target
    target = await getMonthlyTarget(
      tenantId,
      endDate.getFullYear(),
      endDate.getMonth() + 1
    );
  }

  // Calculate achievements
  const revenueAchievement = target.revenueTarget > 0
    ? (kpiSummary.revenueWon / target.revenueTarget) * 100
    : 0;

  const leadsAchievement = target.leadsTarget > 0
    ? (kpiSummary.leadsTotal / target.leadsTarget) * 100
    : 0;

  const jobsAchievement = target.jobsTarget > 0
    ? (kpiSummary.jobsWon / target.jobsTarget) * 100
    : 0;

  return {
    ...kpiSummary,
    revenueTarget: target.revenueTarget,
    leadsTarget: target.leadsTarget,
    jobsTarget: target.jobsTarget,
    revenueAchievement,
    leadsAchievement,
    jobsAchievement,
    revenueStatus: getStatus(revenueAchievement),
    leadsStatus: getStatus(leadsAchievement),
    jobsStatus: getStatus(jobsAchievement),
  };
}

// ============================================
// DAILY KPI AGGREGATION
// ============================================

export async function calculateAndSaveDailyKpi(
  tenantId: string,
  date: Date
): Promise<DailyKpi | null> {
  const dateStr = date.toISOString().split('T')[0];
  const startOfDay = new Date(dateStr);
  const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

  // Fetch leads created/updated on this day
  const { data: leads } = await supabaseAdmin
    .from('GhlLead')
    .select('*')
    .eq('tenantId', tenantId);

  const leadsList = (leads || []) as GhlLead[];

  // Filter by date for different metrics
  const newLeads = leadsList.filter(l => {
    const created = new Date(l.createdAt);
    return created >= startOfDay && created <= endOfDay;
  });

  const wonToday = leadsList.filter(l => {
    if (!l.wonAt) return false;
    const won = new Date(l.wonAt);
    return won >= startOfDay && won <= endOfDay;
  });

  const lostToday = leadsList.filter(l => {
    if (!l.lostAt) return false;
    const lost = new Date(l.lostAt);
    return lost >= startOfDay && lost <= endOfDay;
  });

  // Fetch marketing spend
  const { data: spendData } = await supabaseAdmin
    .from('CampaignSpend')
    .select('spend')
    .eq('tenantId', tenantId)
    .eq('date', dateStr);

  const marketingSpend = (spendData || []).reduce((sum: number, s: { spend?: number }) => sum + (s.spend || 0), 0);

  // Calculate metrics
  const leadsNew = newLeads.length;
  const jobsWon = wonToday.length;
  const jobsLost = lostToday.length;
  const revenueWon = wonToday.reduce((sum, l) => sum + (l.actualValue || l.monetaryValue || 0), 0);
  const revenueLost = lostToday.reduce((sum, l) => sum + (l.estimatedValue || l.monetaryValue || 0), 0);

  const closeRate = (jobsWon + jobsLost) > 0
    ? (jobsWon / (jobsWon + jobsLost)) * 100
    : null;

  const cpl = leadsNew > 0 && marketingSpend > 0
    ? marketingSpend / leadsNew
    : null;

  const cac = jobsWon > 0 && marketingSpend > 0
    ? marketingSpend / jobsWon
    : null;

  const averageTicket = jobsWon > 0
    ? revenueWon / jobsWon
    : null;

  // Calculate leads by source
  const leadsBySource: Record<string, number> = {};
  const revenueBySource: Record<string, number> = {};

  newLeads.forEach(l => {
    const source = l.source || 'unknown';
    leadsBySource[source] = (leadsBySource[source] || 0) + 1;
  });

  wonToday.forEach(l => {
    const source = l.source || 'unknown';
    revenueBySource[source] = (revenueBySource[source] || 0) + (l.actualValue || l.monetaryValue || 0);
  });

  // Upsert daily KPI
  const kpiData = {
    tenantId,
    date: dateStr,
    leadsNew,
    leadsContacted: 0, // Would need to track status changes
    leadsQualified: 0,
    estimatesScheduled: 0,
    estimatesSent: 0,
    estimatesAccepted: jobsWon,
    estimatesDeclined: jobsLost,
    jobsWon,
    jobsLost,
    revenueWon,
    revenueLost,
    marketingSpend,
    cpl,
    cac,
    closeRate,
    conversionRate: null,
    averageTicket,
    leadsBySource,
    revenueBySource,
  };

  const { data, error } = await supabaseAdmin
    .from('DailyKpi')
    .upsert(kpiData, {
      onConflict: 'tenantId,date',
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving daily KPI:', error);
    return null;
  }

  return data as DailyKpi;
}

// ============================================
// MTD / YTD HELPERS
// ============================================

export function getMonthToDateRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date);
  return { start, end };
}

export function getYearToDateRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date);
  return { start, end };
}

export async function getMtdKpi(tenantId: string): Promise<KpiWithTarget> {
  const { start, end } = getMonthToDateRange();
  return calculateKpiWithTarget(tenantId, start, end, 'monthly');
}

export async function getYtdKpi(tenantId: string): Promise<KpiWithTarget> {
  const { start, end } = getYearToDateRange();
  return calculateKpiWithTarget(tenantId, start, end, 'ytd');
}

// ============================================
// TREND ANALYSIS
// ============================================

export interface TrendData {
  date: string;
  leads: number;
  revenue: number;
  jobs: number;
}

export async function getDailyTrend(
  tenantId: string,
  days: number = 30
): Promise<TrendData[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('DailyKpi')
    .select('date, leadsNew, revenueWon, jobsWon')
    .eq('tenantId', tenantId)
    .gte('date', startStr)
    .lte('date', endStr)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching daily trend:', error);
    return [];
  }

  return (data || []).map((d: { date: string; leadsNew?: number; revenueWon?: number; jobsWon?: number }) => ({
    date: d.date,
    leads: d.leadsNew || 0,
    revenue: d.revenueWon || 0,
    jobs: d.jobsWon || 0,
  }));
}

export async function getLeadsBySource(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<Record<string, number>> {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('GhlLead')
    .select('source')
    .eq('tenantId', tenantId)
    .gte('createdAt', startStr)
    .lte('createdAt', endStr + 'T23:59:59');

  if (error) {
    console.error('Error fetching leads by source:', error);
    return {};
  }

  const bySource: Record<string, number> = {};
  (data || []).forEach((l: { source?: string }) => {
    const source = l.source || 'unknown';
    bySource[source] = (bySource[source] || 0) + 1;
  });

  return bySource;
}

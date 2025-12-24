/**
 * Centralized Goal Calculations
 *
 * This file contains all formula calculations for the $1M Formula.
 * All pages must use these functions to ensure consistent numbers.
 *
 * The formula uses a 2-step conversion:
 * 1. Lead → Estimate (leadConversionRate %)
 * 2. Estimate → Sale (closingRate %)
 */

export interface FormulaParams {
  avgTicket: number;
  leadConversionRate: number; // Lead → Estimate %
  closingRate: number; // Estimate → Sale %
  marketingPercent: number;
  productionWeeks: number;
}

export interface CalculatedGoals {
  annual: PeriodGoals;
  monthly: PeriodGoals;
  weekly: PeriodGoals;
  quarterly: PeriodGoals;
}

export interface PeriodGoals {
  revenue: number;
  jobs: number;
  estimates: number;
  leads: number;
  marketing: number;
}

export interface VTOSettings {
  annualTarget: number;
  formulaParams: FormulaParams;
}

// Default settings - SINGLE SOURCE OF TRUTH
export const DEFAULT_VTO_SETTINGS: VTOSettings = {
  annualTarget: 1000000,
  formulaParams: {
    avgTicket: 9500,
    leadConversionRate: 85, // Lead → Estimate (default 85%)
    closingRate: 30, // Estimate → Sale (default 30%)
    marketingPercent: 8,
    productionWeeks: 35,
  },
};

/**
 * Calculate all goals based on annual revenue target and formula parameters.
 * Uses 2-step conversion: Lead → Estimate → Sale
 */
export function calculateGoals(annualTarget: number, params: FormulaParams): CalculatedGoals {
  const { avgTicket, leadConversionRate, closingRate, marketingPercent, productionWeeks } = params;

  // Jobs needed per year
  const jobsPerYear = Math.round(annualTarget / avgTicket);
  const jobsPerWeek = jobsPerYear / productionWeeks;

  // Estimates needed based on closing rate (Estimate → Sale)
  const estimatesPerYear = Math.round(jobsPerYear / (closingRate / 100));
  const estimatesPerWeek = Math.round(estimatesPerYear / productionWeeks);

  // Leads needed based on lead conversion rate (Lead → Estimate)
  const leadsPerYear = Math.round(estimatesPerYear / (leadConversionRate / 100));
  const leadsPerWeek = Math.round(leadsPerYear / productionWeeks);

  const revenuePerWeek = annualTarget / productionWeeks;
  const marketingAnnual = annualTarget * (marketingPercent / 100);

  return {
    annual: {
      revenue: annualTarget,
      jobs: jobsPerYear,
      estimates: estimatesPerYear,
      leads: leadsPerYear,
      marketing: marketingAnnual,
    },
    monthly: {
      revenue: Math.round(annualTarget / 12),
      jobs: Math.round(jobsPerYear / 12),
      estimates: Math.round(estimatesPerYear / 12),
      leads: Math.round(leadsPerYear / 12),
      marketing: Math.round(marketingAnnual / 12),
    },
    weekly: {
      revenue: Math.round(revenuePerWeek),
      jobs: Math.round(jobsPerWeek * 10) / 10,
      estimates: estimatesPerWeek,
      leads: leadsPerWeek,
      marketing: Math.round(marketingAnnual / 52),
    },
    quarterly: {
      revenue: Math.round(annualTarget / 4),
      jobs: Math.round(jobsPerYear / 4),
      estimates: Math.round(estimatesPerYear / 4),
      leads: Math.round(leadsPerYear / 4),
      marketing: Math.round(marketingAnnual / 4),
    },
  };
}

/**
 * Get goals for a specific period
 */
export function getGoalsForPeriod(
  goals: CalculatedGoals,
  period: 'week' | 'month' | 'quarter' | 'year'
): PeriodGoals {
  switch (period) {
    case 'week':
      return goals.weekly;
    case 'quarter':
      return goals.quarterly;
    case 'year':
      return goals.annual;
    default:
      return goals.monthly;
  }
}

/**
 * Format currency consistently across the app
 */
export function formatCurrency(value: number, compact = false): string {
  if (compact && value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (compact && value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Calculate conversion rates from actual data
 */
export function calculateConversionRates(data: {
  leads: number;
  estimates: number;
  sales: number;
}) {
  return {
    leadToEstimate: data.leads > 0 ? Math.round((data.estimates / data.leads) * 100) : 0,
    estimateToSale: data.estimates > 0 ? Math.round((data.sales / data.estimates) * 100) : 0,
    leadToSale: data.leads > 0 ? Math.round((data.sales / data.leads) * 100) : 0,
  };
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(Math.round((current / goal) * 100), 100);
}

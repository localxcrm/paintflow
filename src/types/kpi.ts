// KPI Dashboard Types
// Types for KPI API endpoint with period comparison and trend data

// ============================================
// PERIOD TYPES
// ============================================

/** Period selection for KPI data */
export type KPIPeriod = 'week' | 'month' | 'quarter' | 'year';

// ============================================
// TREND DATA TYPES
// ============================================

/** Single data point for sparkline visualizations */
export interface TrendDataPoint {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Metric value for this date */
  value: number;
}

// ============================================
// METRIC TYPES
// ============================================

/** Metric with period-over-period comparison */
export interface KPIMetric {
  /** Current period value */
  current: number;
  /** Previous period value */
  previous: number;
  /** Percentage change (e.g., 12.5 for +12.5%, -5.3 for -5.3%) */
  delta: number;
  /** Direction of change */
  deltaDirection: 'up' | 'down' | 'flat';
  /** Trend data for sparkline (7-30 points) */
  trend: TrendDataPoint[];
}

// ============================================
// PIPELINE & ATTRIBUTION TYPES
// ============================================

/** Lead pipeline stage data */
export interface LeadPipelineData {
  /** Internal stage identifier */
  stage: string;
  /** Human-readable stage label */
  label: string;
  /** Number of leads at this stage */
  count: number;
  /** Total estimated value at this stage */
  value: number;
}

/** Lead source attribution data */
export interface LeadSourceData {
  /** Source identifier */
  source: string;
  /** Human-readable source label */
  label: string;
  /** Number of leads from this source */
  count: number;
  /** Percentage of total leads */
  percentage: number;
}

// ============================================
// SUBCONTRACTOR RANKING TYPES
// ============================================

/** Subcontractor performance ranking entry */
export interface SubcontractorRankEntry {
  /** Subcontractor ID */
  id: string;
  /** Subcontractor name */
  name: string;
  /** Company name (if applicable) */
  companyName: string | null;
  /** Number of completed jobs */
  jobsCompleted: number;
  /** Total revenue generated */
  totalRevenue: number;
  /** Average review score (1-5, null if no reviews) */
  avgReviewScore: number | null;
  /** Number of reviews received */
  reviewCount: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/** Full KPI API response */
export interface KPIResponse {
  /** Selected period */
  period: KPIPeriod;
  /** Date ranges for current and previous periods */
  dateRange: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  /** Response timestamp */
  updatedAt: string;

  // Hero metrics
  /** Total revenue metric */
  revenue: KPIMetric;
  /** Gross profit metric (revenue - cost of goods) */
  grossProfit: KPIMetric;
  /** Gross margin percentage metric */
  grossMargin: KPIMetric;

  // Secondary metrics
  /** Total leads metric */
  leads: KPIMetric;
  /** Lead-to-job conversion rate percentage metric */
  conversionRate: KPIMetric;
  /** Completed jobs count metric */
  jobsCompleted: KPIMetric;
  /** Average job value metric */
  avgJobValue: KPIMetric;

  // Pipeline and attribution
  /** Lead pipeline stages with counts */
  leadPipeline: LeadPipelineData[];
  /** Lead source attribution */
  leadSources: LeadSourceData[];

  // Subcontractor ranking
  /** Top subcontractors by performance */
  subcontractorRanking: SubcontractorRankEntry[];
}

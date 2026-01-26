// Reports Types
// Types for analytics reports API

// ============================================
// DATE RANGE TYPES
// ============================================

/** Date range for report queries */
export interface ReportDateRange {
  /** Start date (ISO string YYYY-MM-DD) */
  startDate: string;
  /** End date (ISO string YYYY-MM-DD) */
  endDate: string;
}

/** Period comparison data */
export interface PeriodComparison {
  current: ReportDateRange;
  previous: ReportDateRange;
}

// ============================================
// REVENUE REPORT TYPES
// ============================================

/** Daily revenue data point */
export interface DailyRevenue {
  date: string;
  revenue: number;
  jobCount: number;
}

/** Revenue breakdown by category */
export interface RevenueBreakdown {
  interior: number;
  exterior: number;
  both: number;
}

/** Revenue report response */
export interface RevenueReport {
  /** Total revenue for period */
  totalRevenue: number;
  /** Previous period total revenue */
  previousRevenue: number;
  /** Percentage change */
  percentChange: number;
  /** Direction of change */
  changeDirection: 'up' | 'down' | 'flat';
  /** Daily breakdown */
  dailyData: DailyRevenue[];
  /** Revenue by project type */
  byProjectType: RevenueBreakdown;
  /** Average job value */
  avgJobValue: number;
  /** Previous period average job value */
  previousAvgJobValue: number;
  /** Total jobs completed */
  jobsCompleted: number;
  /** Previous period jobs completed */
  previousJobsCompleted: number;
}

// ============================================
// SUBCONTRACTOR PERFORMANCE TYPES
// ============================================

/** Individual subcontractor performance data */
export interface SubPerformanceEntry {
  id: string;
  name: string;
  companyName: string | null;
  specialty: 'interior' | 'exterior' | 'both';
  /** Total jobs assigned */
  totalJobs: number;
  /** Jobs completed */
  completedJobs: number;
  /** Completion rate percentage */
  completionRate: number;
  /** Total revenue generated */
  totalRevenue: number;
  /** Total payout amount */
  totalPayout: number;
  /** Average profit margin */
  avgProfitMargin: number;
  /** Average job value */
  avgJobValue: number;
  /** On-time completion percentage */
  onTimeRate: number;
  /** Average days to complete job */
  avgDaysToComplete: number;
  /** Average review score (1-5) */
  avgReviewScore: number | null;
  /** Total reviews received */
  reviewCount: number;
}

/** Subcontractor performance report response */
export interface SubPerformanceReport {
  /** Period date range */
  dateRange: ReportDateRange;
  /** All subcontractor performance data */
  subcontractors: SubPerformanceEntry[];
  /** Summary statistics */
  summary: {
    totalSubcontractors: number;
    activeSubcontractors: number;
    avgCompletionRate: number;
    avgProfitMargin: number;
    avgOnTimeRate: number;
    topPerformer: SubPerformanceEntry | null;
  };
}

// ============================================
// LEAD SOURCE ROI TYPES
// ============================================

/** Lead source ROI data */
export interface LeadSourceROI {
  /** Source identifier */
  source: string;
  /** Display label */
  label: string;
  /** Total leads from this source */
  totalLeads: number;
  /** Leads converted to jobs */
  convertedLeads: number;
  /** Conversion rate percentage */
  conversionRate: number;
  /** Total revenue from this source */
  totalRevenue: number;
  /** Total profit from this source */
  totalProfit: number;
  /** Marketing spend on this source */
  marketingSpend: number;
  /** ROI percentage ((revenue - spend) / spend * 100) */
  roi: number;
  /** Cost per lead (spend / leads) */
  costPerLead: number;
  /** Cost per acquisition (spend / converted leads) */
  costPerAcquisition: number;
  /** Average job value from this source */
  avgJobValue: number;
}

/** Lead source ROI report response */
export interface LeadSourceROIReport {
  /** Period date range */
  dateRange: ReportDateRange;
  /** ROI data by source */
  sources: LeadSourceROI[];
  /** Summary statistics */
  summary: {
    totalMarketingSpend: number;
    totalRevenue: number;
    totalProfit: number;
    overallROI: number;
    bestROISource: LeadSourceROI | null;
    bestConversionSource: LeadSourceROI | null;
  };
}

// ============================================
// COMBINED REPORTS RESPONSE
// ============================================

/** Full reports API response */
export interface ReportsResponse {
  /** Report generation timestamp */
  generatedAt: string;
  /** Date range for reports */
  dateRange: ReportDateRange;
  /** Comparison period */
  comparisonRange: ReportDateRange;
  /** Revenue report data */
  revenue: RevenueReport;
  /** Subcontractor performance data */
  subPerformance: SubPerformanceReport;
  /** Lead source ROI data */
  leadSourceROI: LeadSourceROIReport;
}

// ============================================
// PDF EXPORT TYPES
// ============================================

/** PDF export request */
export interface PDFExportRequest {
  /** Report type to export */
  reportType: 'revenue' | 'subPerformance' | 'leadSourceROI' | 'all';
  /** Date range for report */
  dateRange: ReportDateRange;
  /** Include charts in PDF */
  includeCharts?: boolean;
  /** Include comparison period */
  includeComparison?: boolean;
}

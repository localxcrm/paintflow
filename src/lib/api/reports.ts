// Reports API client functions
import { api } from './client';
import type { 
  ReportsResponse, 
  RevenueReport, 
  SubPerformanceReport, 
  LeadSourceROIReport,
  ReportDateRange 
} from '@/types/reports';

/**
 * Fetch all reports data
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 */
export async function fetchReports(startDate: string, endDate: string) {
  return api.get<ReportsResponse>(`/reports?startDate=${startDate}&endDate=${endDate}`);
}

/**
 * Fetch revenue report only
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 */
export async function fetchRevenueReport(startDate: string, endDate: string) {
  return api.get<RevenueReport>(`/reports/revenue?startDate=${startDate}&endDate=${endDate}`);
}

/**
 * Fetch subcontractor performance report
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 */
export async function fetchSubPerformanceReport(startDate: string, endDate: string) {
  return api.get<SubPerformanceReport>(`/reports/sub-performance?startDate=${startDate}&endDate=${endDate}`);
}

/**
 * Fetch lead source ROI report
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 */
export async function fetchLeadSourceROIReport(startDate: string, endDate: string) {
  return api.get<LeadSourceROIReport>(`/reports/lead-roi?startDate=${startDate}&endDate=${endDate}`);
}

/**
 * Export report as PDF (returns blob URL)
 * @param reportType - Type of report to export
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 */
export async function exportReportPDF(
  reportType: 'revenue' | 'subPerformance' | 'leadSourceROI' | 'all',
  startDate: string,
  endDate: string
) {
  const response = await fetch(
    `/api/reports/pdf?type=${reportType}&startDate=${startDate}&endDate=${endDate}`,
    { method: 'GET' }
  );
  
  if (!response.ok) {
    const error = await response.json();
    return { error: error.message || 'Failed to generate PDF' };
  }
  
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  return { data: url };
}

/**
 * Reports API object following existing API pattern
 */
export const reportsApi = {
  /**
   * Get all reports data
   */
  async getReports(startDate: string, endDate: string) {
    return fetchReports(startDate, endDate);
  },

  /**
   * Get revenue report
   */
  async getRevenueReport(startDate: string, endDate: string) {
    return fetchRevenueReport(startDate, endDate);
  },

  /**
   * Get subcontractor performance report
   */
  async getSubPerformanceReport(startDate: string, endDate: string) {
    return fetchSubPerformanceReport(startDate, endDate);
  },

  /**
   * Get lead source ROI report
   */
  async getLeadSourceROIReport(startDate: string, endDate: string) {
    return fetchLeadSourceROIReport(startDate, endDate);
  },

  /**
   * Export report as PDF
   */
  async exportPDF(
    reportType: 'revenue' | 'subPerformance' | 'leadSourceROI' | 'all',
    startDate: string,
    endDate: string
  ) {
    return exportReportPDF(reportType, startDate, endDate);
  },
};

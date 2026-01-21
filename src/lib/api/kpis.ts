// KPI API client functions
import { api } from './client';
import type { KPIResponse, KPIPeriod } from '@/types/kpi';

/**
 * Fetch KPI dashboard data with period comparison
 * @param period - Time period for KPI calculation (week, month, quarter, year)
 * @returns KPI response with metrics, trends, and rankings
 */
export async function fetchKPIs(period: KPIPeriod = 'month') {
  return api.get<KPIResponse>(`/kpis?period=${period}`);
}

/**
 * KPI API object following existing API pattern
 */
export const kpisApi = {
  /**
   * Get KPI dashboard data with period comparison
   * @param period - Time period for KPI calculation (week, month, quarter, year)
   */
  async getKPIs(period: KPIPeriod = 'month') {
    return fetchKPIs(period);
  },
};

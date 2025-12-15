import { api } from './client';

export interface DashboardStats {
  leads: {
    total: number;
    new: number;
    inProgress: number;
    converted: number;
    conversionRate: number;
  };
  jobs: {
    total: number;
    active: number;
    completed: number;
    scheduled: number;
  };
  revenue: {
    mtd: number;
    ytd: number;
    pipeline: number;
    avgJobValue: number;
  };
  profitability: {
    grossProfit: number;
    grossMargin: number;
    targetMargin: number;
  };
  collections: {
    outstanding: number;
    avgDaysToCollect: number;
    targetDays: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'lead' | 'estimate' | 'job' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

export interface UpcomingItem {
  id: string;
  type: 'job' | 'followup' | 'payment';
  title: string;
  dueDate: string;
  clientName: string;
  amount?: number;
}

export const dashboardApi = {
  // Get dashboard statistics
  async getStats() {
    return api.get<DashboardStats>('/dashboard/stats');
  },

  // Get recent activity
  async getRecentActivity(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return api.get<RecentActivity[]>(`/dashboard/activity${query}`);
  },

  // Get upcoming items (jobs, followups, payments)
  async getUpcoming(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return api.get<UpcomingItem[]>(`/dashboard/upcoming${query}`);
  },

  // Get revenue chart data
  async getRevenueChart(period?: 'week' | 'month' | 'quarter' | 'year') {
    const query = period ? `?period=${period}` : '';
    return api.get<{ date: string; revenue: number; profit: number }[]>(`/dashboard/revenue-chart${query}`);
  },

  // Get lead sources breakdown
  async getLeadSources() {
    return api.get<{ source: string; count: number; value: number }[]>('/dashboard/lead-sources');
  },

  // Get job status breakdown
  async getJobStatusBreakdown() {
    return api.get<{ status: string; count: number; value: number }[]>('/dashboard/job-status');
  },
};

'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { PipelineChart } from '@/components/dashboard/pipeline-chart';
import { RecentJobs } from '@/components/dashboard/recent-jobs';
import { UpcomingFollowups, PendingTodos } from '@/components/dashboard/upcoming-followups';
import { mockDashboardKPIs } from '@/lib/mock-data';
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Target,
  Clock,
  AlertTriangle,
  Users,
  Percent,
} from 'lucide-react';

function formatCurrency(amount: number, compact = false) {
  if (compact && amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (compact && amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const kpis = mockDashboardKPIs;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here&apos;s your business at a glance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Revenue YTD"
          value={formatCurrency(kpis.revenueYTD, true)}
          subtitle={`Target: $5M (${((kpis.revenueYTD / 5000000) * 100).toFixed(0)}%)`}
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          variant="default"
        />
        <KPICard
          title="Gross Margin"
          value={`${kpis.grossMarginPct.toFixed(1)}%`}
          subtitle="Target: 40%"
          icon={TrendingUp}
          trend={{ value: 2.3, isPositive: true }}
          variant="success"
        />
        <KPICard
          title="Jobs Completed"
          value={kpis.jobsCount}
          subtitle={`Avg: ${formatCurrency(kpis.avgJobSize)}/job`}
          icon={Briefcase}
          trend={{ value: 8, isPositive: true }}
        />
        <KPICard
          title="Close Rate"
          value={`${kpis.closeRate}%`}
          subtitle={`${kpis.leadsYTD} leads YTD`}
          icon={Target}
          trend={{ value: 3, isPositive: true }}
          variant="default"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Avg GP/Job"
          value={formatCurrency(kpis.avgGpPerJob)}
          subtitle="Min target: $900"
          icon={DollarSign}
          variant="success"
        />
        <KPICard
          title="Net Margin"
          value={`${kpis.netMarginPct.toFixed(1)}%`}
          subtitle="After operating expenses"
          icon={Percent}
          variant="default"
        />
        <KPICard
          title="Days to Collect"
          value={kpis.avgDaysToCollect.toFixed(1)}
          subtitle="Target: 7 days"
          icon={Clock}
          variant="success"
        />
        <KPICard
          title="Flagged Jobs"
          value={kpis.flaggedJobsCount}
          subtitle="Need attention"
          icon={AlertTriangle}
          variant={kpis.flaggedJobsCount > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueChart />
        <PipelineChart />
      </div>

      {/* Recent Jobs */}
      <RecentJobs />

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingFollowups />
        <PendingTodos />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { PipelineChart } from '@/components/dashboard/pipeline-chart';
import { RecentJobs } from '@/components/dashboard/recent-jobs';
import { UpcomingFollowups, PendingTodos } from '@/components/dashboard/upcoming-followups';
import { mockDashboardKPIs } from '@/lib/mock-data';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  Briefcase,
  Target,
  Clock,
  AlertTriangle,
  Percent,
  Megaphone,
  Star,
  Users,
  ArrowUpRight,
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

interface DashboardData {
  leads: { total: number; conversionRate: number };
  estimates: { closeRate: number; avgValue: number };
  jobs: { completed: number; total: number };
  financials: { totalRevenue: number; totalGrossProfit: number; avgGrossMargin: number };
  payments: { avgDaysToCollect: number; totalOutstanding: number };
  profitFlags: { jobsWithIssues: number };
  marketing?: { cpl: number; roi: number; totalSpend: number; percentOfRevenue: number };
  salesFunnel?: { closingRate: number; issueRate: number; nsli: number; avgSale: number };
  reviews?: { total: number; avgRating: number; fiveStarPct: number };
  profitAndLoss?: { netProfit: number; netMargin: number; contributionProfit: number };
  goalAttainment?: { hasTargets: boolean; revenue: number; leads: number; sales: number };
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/dashboard?period=${period}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use mock data as fallback
  const kpis = mockDashboardKPIs;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back! Here&apos;s your business at a glance.</p>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="quarter">Quarter</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Primary KPI Cards - Revenue & Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Revenue"
          value={formatCurrency(data?.financials?.totalRevenue ?? kpis.revenueYTD, true)}
          subtitle={data?.goalAttainment?.hasTargets ? `${data.goalAttainment.revenue.toFixed(0)}% of goal` : `Target: $5M`}
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          variant="default"
        />
        <KPICard
          title="Gross Profit"
          value={formatCurrency(data?.financials?.totalGrossProfit ?? kpis.revenueYTD * 0.42, true)}
          subtitle={`${(data?.financials?.avgGrossMargin ?? kpis.grossMarginPct).toFixed(1)}% margin`}
          icon={TrendingUp}
          trend={{ value: 2.3, isPositive: true }}
          variant="success"
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(data?.profitAndLoss?.netProfit ?? kpis.revenueYTD * 0.08, true)}
          subtitle={`${(data?.profitAndLoss?.netMargin ?? kpis.netMarginPct).toFixed(1)}% net margin`}
          icon={ArrowUpRight}
          trend={{ value: 5.2, isPositive: true }}
          variant="success"
        />
        <KPICard
          title="Jobs Completed"
          value={data?.jobs?.completed ?? kpis.jobsCount}
          subtitle={`Avg: ${formatCurrency(data?.salesFunnel?.avgSale ?? kpis.avgJobSize)}/job`}
          icon={Briefcase}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Sales Funnel KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Leads"
          value={data?.leads?.total ?? kpis.leadsYTD}
          subtitle={data?.goalAttainment?.hasTargets ? `${data.goalAttainment.leads.toFixed(0)}% of goal` : 'Total leads'}
          icon={Users}
          variant="default"
        />
        <KPICard
          title="Closing Rate"
          value={`${(data?.salesFunnel?.closingRate ?? kpis.closeRate).toFixed(1)}%`}
          subtitle="Proposals to sales"
          icon={Target}
          trend={{ value: 3, isPositive: true }}
          variant="default"
        />
        <KPICard
          title="NSLI"
          value={formatCurrency(data?.salesFunnel?.nsli ?? kpis.avgJobSize * 0.4)}
          subtitle="Net sales per lead"
          icon={DollarSign}
          variant="default"
        />
        <KPICard
          title="Avg Sale"
          value={formatCurrency(data?.salesFunnel?.avgSale ?? kpis.avgJobSize)}
          subtitle="Per closed deal"
          icon={DollarSign}
          variant="default"
        />
      </div>

      {/* Marketing & Reviews KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Marketing ROI"
          value={`${(data?.marketing?.roi ?? 10).toFixed(1)}:1`}
          subtitle={`${formatCurrency(data?.marketing?.totalSpend ?? 10000)} spent`}
          icon={Megaphone}
          variant="default"
        />
        <KPICard
          title="Cost Per Lead"
          value={formatCurrency(data?.marketing?.cpl ?? 125)}
          subtitle={`${(data?.marketing?.percentOfRevenue ?? 10).toFixed(1)}% of revenue`}
          icon={Megaphone}
          variant="default"
        />
        <KPICard
          title="Reviews"
          value={data?.reviews?.total ?? 0}
          subtitle={`${(data?.reviews?.avgRating ?? 0).toFixed(1)} avg rating`}
          icon={Star}
          variant="default"
        />
        <KPICard
          title="5-Star Reviews"
          value={`${(data?.reviews?.fiveStarPct ?? 0).toFixed(0)}%`}
          subtitle="Of all reviews"
          icon={Star}
          variant={data?.reviews?.fiveStarPct && data.reviews.fiveStarPct >= 80 ? 'success' : 'default'}
        />
      </div>

      {/* Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Days to Collect"
          value={(data?.payments?.avgDaysToCollect ?? kpis.avgDaysToCollect).toFixed(1)}
          subtitle="Target: 7 days"
          icon={Clock}
          variant={data?.payments?.avgDaysToCollect && data.payments.avgDaysToCollect <= 7 ? 'success' : 'warning'}
        />
        <KPICard
          title="Outstanding AR"
          value={formatCurrency(data?.payments?.totalOutstanding ?? 0, true)}
          subtitle="Unpaid balances"
          icon={DollarSign}
          variant="default"
        />
        <KPICard
          title="Gross Margin"
          value={`${(data?.financials?.avgGrossMargin ?? kpis.grossMarginPct).toFixed(1)}%`}
          subtitle="Target: 40%"
          icon={Percent}
          variant={(data?.financials?.avgGrossMargin ?? kpis.grossMarginPct) >= 40 ? 'success' : 'warning'}
        />
        <KPICard
          title="Flagged Jobs"
          value={data?.profitFlags?.jobsWithIssues ?? kpis.flaggedJobsCount}
          subtitle="Need attention"
          icon={AlertTriangle}
          variant={(data?.profitFlags?.jobsWithIssues ?? kpis.flaggedJobsCount) > 0 ? 'warning' : 'success'}
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

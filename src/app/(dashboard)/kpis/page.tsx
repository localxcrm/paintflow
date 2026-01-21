'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Briefcase,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { PeriodSelector } from '@/components/kpi/period-selector';
import { KPICardEnhanced } from '@/components/kpi/kpi-card-enhanced';
import { LeadPipelineFunnel } from '@/components/kpi/lead-pipeline-funnel';
import { LeadSourcePie } from '@/components/kpi/lead-source-pie';
import { SubcontractorLeaderboard } from '@/components/kpi/subcontractor-leaderboard';

import { useStickyState } from '@/hooks/use-sticky-state';
import { fetchKPIs } from '@/lib/api/kpis';
import { KPIResponse, KPIPeriod } from '@/types/kpi';

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'agora mesmo';
  if (seconds < 120) return 'ha 1 minuto';
  if (seconds < 3600) return `ha ${Math.floor(seconds / 60)} minutos`;
  return `ha ${Math.floor(seconds / 3600)} hora(s)`;
}

export default function KPIDashboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useStickyState<KPIPeriod>('month', 'kpi-dashboard-period');
  const [data, setData] = useState<KPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const response = await fetchKPIs(period);
      setData(response);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load KPIs:', error);
      toast.error('Erro ao carregar KPIs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  // Initial load and period change
  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadData]);

  // Manual refresh handler
  const handleRefresh = () => {
    loadData(true);
  };

  // Drill-down handlers
  const handleLeadStageClick = (stage: string) => {
    router.push(`/leads?status=${stage}`);
  };

  const handleLeadSourceClick = (source: string) => {
    router.push(`/leads?source=${source}`);
  };

  const handleSubcontractorClick = (id: string) => {
    router.push(`/equipe?sub=${id}`);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Erro ao carregar dados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KPIs</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            {lastUpdated && (
              <span>Atualizado {formatTimeAgo(lastUpdated)}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Hero KPI Cards - Revenue & Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardEnhanced
          title="Receita"
          metric={data.revenue}
          format="currency"
          icon={DollarSign}
          variant="default"
        />
        <KPICardEnhanced
          title="Lucro Bruto"
          metric={data.grossProfit}
          format="currency"
          icon={TrendingUp}
          variant="success"
        />
        <KPICardEnhanced
          title="Margem Bruta"
          metric={data.grossMargin}
          format="percent"
          icon={Calculator}
          variant={data.grossMargin.current >= 40 ? 'success' : 'warning'}
        />
        <KPICardEnhanced
          title="Trabalhos Concluidos"
          metric={data.jobsCompleted}
          format="number"
          icon={Briefcase}
        />
      </div>

      {/* Secondary KPI Cards - Leads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICardEnhanced
          title="Leads"
          metric={data.leads}
          format="number"
          icon={Users}
        />
        <KPICardEnhanced
          title="Taxa de Conversao"
          metric={data.conversionRate}
          format="percent"
          icon={Target}
          variant={data.conversionRate.current >= 30 ? 'success' : 'default'}
        />
        <KPICardEnhanced
          title="Ticket Medio"
          metric={data.avgJobValue}
          format="currency"
          icon={DollarSign}
        />
      </div>

      {/* Charts Row - Pipeline and Attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadPipelineFunnel
          data={data.leadPipeline}
          onClick={handleLeadStageClick}
        />
        <LeadSourcePie
          data={data.leadSources}
          onClick={handleLeadSourceClick}
        />
      </div>

      {/* Subcontractor Ranking */}
      <SubcontractorLeaderboard
        data={data.subcontractorRanking}
        onSubcontractorClick={handleSubcontractorClick}
      />
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  Target,
  RefreshCw,
  FileDown,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { DateRangePicker } from '@/components/reports/date-range-picker';
import { ReportCard, ReportSection } from '@/components/reports/report-card';
import { RevenueChart } from '@/components/reports/revenue-chart';
import { RevenueTypeChart } from '@/components/reports/revenue-type-chart';
import { LeadROIChart } from '@/components/reports/lead-roi-chart';
import { SubPerformanceChart } from '@/components/reports/sub-performance-chart';
import { fetchReports } from '@/lib/api/reports';
import type { ReportsResponse } from '@/types/reports';

// Helper to format currency
function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}

// Helper to format percentage
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function ReportsPage() {
  // Default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = useCallback(async (showRefresh = false) => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      const response = await fetchReports(startDate, endDate);
      
      if (response.error) {
        console.error('Failed to load reports:', response.error);
        toast.error('Erro ao carregar relatórios');
        return;
      }
      
      if (response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  // Load data when date range changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manual refresh
  const handleRefresh = () => {
    loadData(true);
  };

  // Export PDF (placeholder for now)
  const handleExportPDF = async () => {
    toast.info('Exportação PDF será implementada em breve');
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
          <p className="text-sm text-slate-500">
            Análise detalhada de receita, performance e ROI
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="subcontractors">Subcontratados</TabsTrigger>
          <TabsTrigger value="leadroi">ROI de Leads</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Hero Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard
              title="Receita Total"
              icon={DollarSign}
              value={formatCurrency(data.revenue.totalRevenue)}
              previousValue={formatCurrency(data.revenue.previousRevenue)}
              percentChange={data.revenue.percentChange}
              changeDirection={data.revenue.changeDirection}
            />
            <ReportCard
              title="Trabalhos Concluídos"
              icon={Briefcase}
              value={data.revenue.jobsCompleted.toString()}
              previousValue={data.revenue.previousJobsCompleted.toString()}
              percentChange={
                data.revenue.previousJobsCompleted > 0
                  ? ((data.revenue.jobsCompleted - data.revenue.previousJobsCompleted) / 
                     data.revenue.previousJobsCompleted) * 100
                  : 0
              }
              changeDirection={
                data.revenue.jobsCompleted > data.revenue.previousJobsCompleted ? 'up' :
                data.revenue.jobsCompleted < data.revenue.previousJobsCompleted ? 'down' : 'flat'
              }
            />
            <ReportCard
              title="Ticket Médio"
              icon={TrendingUp}
              value={formatCurrency(data.revenue.avgJobValue)}
              previousValue={formatCurrency(data.revenue.previousAvgJobValue)}
              percentChange={
                data.revenue.previousAvgJobValue > 0
                  ? ((data.revenue.avgJobValue - data.revenue.previousAvgJobValue) / 
                     data.revenue.previousAvgJobValue) * 100
                  : 0
              }
              changeDirection={
                data.revenue.avgJobValue > data.revenue.previousAvgJobValue ? 'up' :
                data.revenue.avgJobValue < data.revenue.previousAvgJobValue ? 'down' : 'flat'
              }
            />
            <ReportCard
              title="ROI Marketing"
              icon={Target}
              value={formatPercent(data.leadSourceROI.summary.overallROI)}
              description="Retorno sobre investimento"
            />
          </div>

          {/* Sub Performance Summary */}
          <ReportSection
            title="Performance de Subcontratados"
            description="Top performers do período"
            icon={Users}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">
                  {data.subPerformance.summary.activeSubcontractors}
                </p>
                <p className="text-sm text-slate-500">Ativos no Período</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">
                  {formatPercent(data.subPerformance.summary.avgProfitMargin)}
                </p>
                <p className="text-sm text-slate-500">Margem Média</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">
                  {formatPercent(data.subPerformance.summary.avgOnTimeRate)}
                </p>
                <p className="text-sm text-slate-500">Taxa de Pontualidade</p>
              </div>
            </div>
            
            {data.subPerformance.summary.topPerformer && (
              <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  🏆 Top Performer: <strong>{data.subPerformance.summary.topPerformer.name}</strong>
                  {' '}com {formatPercent(data.subPerformance.summary.topPerformer.avgProfitMargin)} de margem média
                </p>
              </div>
            )}
          </ReportSection>

          {/* Lead Sources Summary */}
          <ReportSection
            title="Fontes de Leads"
            description="Performance por canal de aquisição"
            icon={BarChart3}
          >
            <div className="space-y-3 mt-4">
              {data.leadSourceROI.sources.slice(0, 5).map((source) => (
                <div
                  key={source.source}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900">{source.label}</p>
                    <p className="text-sm text-slate-500">
                      {source.totalLeads} leads • {source.convertedLeads} convertidos
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">
                      {formatCurrency(source.totalRevenue)}
                    </p>
                    <p className={cn(
                      'text-sm',
                      source.roi > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      ROI: {formatPercent(source.roi)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ReportSection>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ReportCard
              title="Receita Total"
              icon={DollarSign}
              value={formatCurrency(data.revenue.totalRevenue)}
              previousValue={formatCurrency(data.revenue.previousRevenue)}
              percentChange={data.revenue.percentChange}
              changeDirection={data.revenue.changeDirection}
            />
            <ReportCard
              title="Ticket Médio"
              icon={TrendingUp}
              value={formatCurrency(data.revenue.avgJobValue)}
            />
            <ReportCard
              title="Trabalhos"
              icon={Briefcase}
              value={data.revenue.jobsCompleted.toString()}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart
              data={data.revenue.dailyData}
              type="area"
              title="Receita Diária"
            />
            <RevenueTypeChart
              data={data.revenue.byProjectType}
              title="Receita por Tipo de Projeto"
            />
          </div>
        </TabsContent>

        {/* Subcontractors Tab */}
        <TabsContent value="subcontractors" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <ReportCard
              title="Total de Subs"
              icon={Users}
              value={data.subPerformance.summary.totalSubcontractors.toString()}
            />
            <ReportCard
              title="Ativos"
              icon={Users}
              value={data.subPerformance.summary.activeSubcontractors.toString()}
            />
            <ReportCard
              title="Margem Média"
              icon={TrendingUp}
              value={formatPercent(data.subPerformance.summary.avgProfitMargin)}
            />
            <ReportCard
              title="Pontualidade"
              icon={Target}
              value={formatPercent(data.subPerformance.summary.avgOnTimeRate)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubPerformanceChart
              data={data.subPerformance.subcontractors}
              metric="revenue"
              title="Receita por Subcontratado"
            />
            <SubPerformanceChart
              data={data.subPerformance.subcontractors}
              metric="margin"
              title="Margem por Subcontratado"
            />
          </div>

          <ReportSection title="Performance Individual">
            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Nome</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Jobs</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Receita</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Margem</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Pontualidade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subPerformance.subcontractors.map((sub) => (
                    <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">{sub.name}</p>
                        {sub.companyName && (
                          <p className="text-sm text-slate-500">{sub.companyName}</p>
                        )}
                      </td>
                      <td className="text-right py-3 px-4 text-slate-900">
                        {sub.completedJobs}/{sub.totalJobs}
                      </td>
                      <td className="text-right py-3 px-4 text-slate-900">
                        {formatCurrency(sub.totalRevenue)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={cn(
                          'font-medium',
                          sub.avgProfitMargin >= 40 ? 'text-green-600' :
                          sub.avgProfitMargin >= 25 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {formatPercent(sub.avgProfitMargin)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={cn(
                          'font-medium',
                          sub.onTimeRate >= 90 ? 'text-green-600' :
                          sub.onTimeRate >= 75 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {formatPercent(sub.onTimeRate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>
        </TabsContent>

        {/* Lead ROI Tab */}
        <TabsContent value="leadroi" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <ReportCard
              title="Investimento Total"
              icon={DollarSign}
              value={formatCurrency(data.leadSourceROI.summary.totalMarketingSpend)}
            />
            <ReportCard
              title="Receita Gerada"
              icon={TrendingUp}
              value={formatCurrency(data.leadSourceROI.summary.totalRevenue)}
            />
            <ReportCard
              title="Lucro Total"
              icon={TrendingUp}
              value={formatCurrency(data.leadSourceROI.summary.totalProfit)}
            />
            <ReportCard
              title="ROI Geral"
              icon={Target}
              value={formatPercent(data.leadSourceROI.summary.overallROI)}
              changeDirection={data.leadSourceROI.summary.overallROI > 0 ? 'up' : 'down'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeadROIChart
              data={data.leadSourceROI.sources}
              metric="roi"
              title="ROI por Fonte"
            />
            <LeadROIChart
              data={data.leadSourceROI.sources}
              metric="revenue"
              title="Receita por Fonte"
            />
          </div>

          <ReportSection title="Performance por Fonte">
            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Fonte</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Leads</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Conversão</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Receita</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Investimento</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">ROI</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">CPL</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leadSourceROI.sources.map((source) => (
                    <tr key={source.source} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{source.label}</td>
                      <td className="text-right py-3 px-4 text-slate-900">
                        {source.totalLeads}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={cn(
                          'font-medium',
                          source.conversionRate >= 30 ? 'text-green-600' :
                          source.conversionRate >= 15 ? 'text-amber-600' : 'text-slate-600'
                        )}>
                          {formatPercent(source.conversionRate)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-slate-900">
                        {formatCurrency(source.totalRevenue)}
                      </td>
                      <td className="text-right py-3 px-4 text-slate-900">
                        {formatCurrency(source.marketingSpend)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={cn(
                          'font-medium',
                          source.roi > 100 ? 'text-green-600' :
                          source.roi > 0 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {formatPercent(source.roi)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-slate-600">
                        {formatCurrency(source.costPerLead)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}

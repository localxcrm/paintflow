'use client';

import { useState, useEffect, useMemo } from 'react';
import { ProgressCard } from '@/components/dashboard/progress-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  FileText,
  TrendingUp,
  Megaphone,
  Star,
  Plus,
  ArrowRight,
  Target,
  CheckCircle2,
  Circle,
  Mountain,
} from 'lucide-react';
import Link from 'next/link';
import { useRocks } from '@/hooks/useRocks';

interface FormulaParams {
  avgTicket: number;
  closingRate: number;
  marketingPercent: number;
  productionWeeks: number;
}

function calculateGoals(annualTarget: number, params: FormulaParams) {
  const { avgTicket, closingRate, marketingPercent, productionWeeks } = params;

  const jobsPerYear = Math.round(annualTarget / avgTicket);
  const jobsPerWeek = jobsPerYear / productionWeeks;
  const leadsPerYear = Math.round(jobsPerYear / (closingRate / 100));
  const leadsPerWeek = Math.round(leadsPerYear / productionWeeks);
  const revenuePerWeek = annualTarget / productionWeeks;
  const marketingAnnual = annualTarget * (marketingPercent / 100);

  return {
    annual: {
      revenue: annualTarget,
      jobs: jobsPerYear,
      leads: leadsPerYear,
      marketing: marketingAnnual,
    },
    monthly: {
      revenue: Math.round(annualTarget / 12),
      jobs: Math.round(jobsPerYear / 12),
      leads: Math.round(leadsPerYear / 12),
      marketing: Math.round(marketingAnnual / 12),
    },
    weekly: {
      revenue: Math.round(revenuePerWeek),
      jobs: Math.round(jobsPerWeek * 10) / 10,
      leads: leadsPerWeek,
      marketing: Math.round(marketingAnnual / 52),
    },
    quarterly: {
      revenue: Math.round(annualTarget / 4),
      jobs: Math.round(jobsPerYear / 4),
      leads: Math.round(leadsPerYear / 4),
      marketing: Math.round(marketingAnnual / 4),
    },
  };
}

interface DashboardData {
  leads: { total: number; goal: number };
  sales: { total: number; goal: number; closingRate: number };
  revenue: { total: number; goal: number };
  marketing: { spent: number; cpl: number; roi: number };
  reviews: { total: number; goal: number; avgRating: number };
}

interface VTOSettings {
  annualTarget: number;
  formulaParams: FormulaParams;
}

const defaultSettings: VTOSettings = {
  annualTarget: 1000000,
  formulaParams: {
    avgTicket: 9500,
    closingRate: 30,
    marketingPercent: 8,
    productionWeeks: 35,
  },
};

export default function PainelPage() {
  const [period, setPeriod] = useState('month');
  const [settings, setSettings] = useState<VTOSettings>(defaultSettings);
  const [ytdRevenue, setYtdRevenue] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { getCurrentQuarterRocks, updateStatus, currentQuarter, currentYear } = useRocks();
  const quarterRocks = getCurrentQuarterRocks();

  const goals = calculateGoals(settings.annualTarget, settings.formulaParams);

  const getGoalsForPeriod = () => {
    switch (period) {
      case 'week':
        return goals.weekly;
      case 'quarter':
        return goals.quarterly;
      default:
        return goals.monthly;
    }
  };

  const periodGoals = getGoalsForPeriod();

  useEffect(() => {
    const saved = localStorage.getItem('paintpro_vto');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          annualTarget: parsed.annualTarget || defaultSettings.annualTarget,
          formulaParams: {
            ...defaultSettings.formulaParams,
            ...parsed.formulaParams,
          },
        });
      } catch (e) {
        console.error('Error loading VTO settings:', e);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/dashboard?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData({
          leads: {
            total: json.leads?.total || 0,
            goal: periodGoals.leads,
          },
          sales: {
            total: json.jobs?.completed || 0,
            goal: Math.round(periodGoals.jobs),
            closingRate: json.salesFunnel?.closingRate || 0,
          },
          revenue: {
            total: json.financials?.totalRevenue || 0,
            goal: periodGoals.revenue,
          },
          marketing: {
            spent: json.marketing?.totalSpend || 0,
            cpl: json.marketing?.cpl || 0,
            roi: json.marketing?.roi || 0,
          },
          reviews: {
            total: json.reviews?.total || 0,
            goal: period === 'week' ? 2 : period === 'month' ? 10 : 30,
            avgRating: json.reviews?.avgRating || 0,
          },
        });
        setYtdRevenue(json.financials?.totalRevenue || 0);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const periodLabel =
    period === 'week' ? 'Esta Semana' : period === 'month' ? 'Este Mes' : 'Este Trimestre';

  const formatCurrency = (value: number, compact = false) => {
    if (compact && value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (compact && value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString('en-US')}`;
  };

  const vtoProgress = settings.annualTarget > 0 ? (ytdRevenue / settings.annualTarget) * 100 : 0;

  const completedRocks = quarterRocks.filter((r) => r.status === 'complete').length;
  const totalRocks = quarterRocks.length;

  const displayData = data || {
    leads: { total: 0, goal: periodGoals.leads },
    sales: { total: 0, goal: Math.round(periodGoals.jobs), closingRate: 0 },
    revenue: { total: 0, goal: periodGoals.revenue },
    marketing: { spent: 0, cpl: 0, roi: 0 },
    reviews: { total: 0, goal: 10, avgRating: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Painel</h1>
          <p className="text-slate-500">
            Acompanhe suas metas e resultados
          </p>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="quarter">Trimestre</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* VTO Summary Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Sua Visao</h2>
                <p className="text-sm text-slate-500">Meta 1 Ano</p>
              </div>
            </div>
            <Link href="/goals">
              <Button variant="ghost" size="sm">
                Editar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {/* Annual Target Progress */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-bold text-slate-900">
                  {formatCurrency(ytdRevenue, true)}
                </span>
                <span className="text-sm text-slate-500">
                  de {formatCurrency(settings.annualTarget, true)}
                </span>
              </div>
              <Progress
                value={Math.min(vtoProgress, 100)}
                className="h-3"
              />
              <p className="text-xs text-slate-500 mt-1">
                {vtoProgress.toFixed(0)}% da meta anual
              </p>
            </div>

            {/* Quarterly Rocks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <Mountain className="w-4 h-4" />
                  Rocks Q{currentQuarter} {currentYear}
                </h3>
                <span className="text-xs text-slate-500">
                  {completedRocks}/{totalRocks} concluidos
                </span>
              </div>
              <div className="space-y-2">
                {quarterRocks.slice(0, 5).map((rock) => (
                  <div key={rock.id} className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateStatus(rock.id, rock.status === 'complete' ? 'on_track' : 'complete')
                      }
                    >
                      {rock.status === 'complete' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>
                    <span
                      className={`text-sm flex-1 ${rock.status === 'complete' ? 'text-slate-400 line-through' : 'text-slate-700'
                        }`}
                    >
                      {rock.title}
                    </span>
                    {rock.progress > 0 && (
                      <span className="text-xs text-slate-500">{rock.progress}%</span>
                    )}
                  </div>
                ))}
                {quarterRocks.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Nenhum rock para este trimestre.{' '}
                    <Link href="/rocks" className="text-blue-600 hover:underline">
                      Adicionar rocks
                    </Link>
                  </p>
                )}
                {quarterRocks.length > 5 && (
                  <Link
                    href="/rocks"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Ver todos os {quarterRocks.length} rocks
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/vendas?action=lead">
          <Button className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Novo Lead
          </Button>
        </Link>
        <Link href="/vendas?action=sale">
          <Button variant="outline" className="w-full h-14 text-base border-2">
            <TrendingUp className="w-5 h-5 mr-2" />
            Registrar Venda
          </Button>
        </Link>
        <Link href="/marketing">
          <Button variant="outline" className="w-full h-14 text-base border-2">
            <Megaphone className="w-5 h-5 mr-2" />
            Marketing
          </Button>
        </Link>
        <Link href="/conhecimento">
          <Button variant="outline" className="w-full h-14 text-base border-2">
            <FileText className="w-5 h-5 mr-2" />
            SOPs
          </Button>
        </Link>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProgressCard
          title="Leads"
          subtitle={periodLabel}
          current={displayData.leads.total}
          goal={displayData.leads.goal}
          icon={Users}
        />
        <ProgressCard
          title="Vendas"
          subtitle={`Taxa de fechamento: ${displayData.sales.closingRate.toFixed(0)}%`}
          current={displayData.sales.total}
          goal={displayData.sales.goal}
          icon={TrendingUp}
        />
        <ProgressCard
          title="Faturamento"
          subtitle={periodLabel}
          current={displayData.revenue.total}
          goal={displayData.revenue.goal}
          format="currency"
          icon={TrendingUp}
        />
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Marketing ROI Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-500" />
              ROI de Marketing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(displayData.marketing.spent, true)}
                </p>
                <p className="text-xs text-slate-500">Investido</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  ${displayData.marketing.cpl.toFixed(0)}
                </p>
                <p className="text-xs text-slate-500">Custo/Lead</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {displayData.marketing.roi.toFixed(1)}x
                </p>
                <p className="text-xs text-slate-500">ROI</p>
              </div>
            </div>
            <Link href="/marketing" className="block mt-4">
              <Button variant="ghost" className="w-full text-sm">
                Ver detalhes <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Reviews Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Avaliacoes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-slate-900">
                  {displayData.reviews.avgRating > 0
                    ? displayData.reviews.avgRating.toFixed(1)
                    : '-'}
                </p>
                <p className="text-sm text-slate-500">Nota media</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{displayData.reviews.total}</p>
                <p className="text-sm text-slate-500">de {displayData.reviews.goal} avaliacoes</p>
              </div>
            </div>
            <div className="flex gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${star <= Math.round(displayData.reviews.avgRating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-200'
                    }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formula Reference */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-700 mb-2">
            Formula para {formatCurrency(settings.annualTarget, true)}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Leads/semana:</span>
              <span className="font-medium ml-2">{goals.weekly.leads}</span>
            </div>
            <div>
              <span className="text-slate-500">Vendas/semana:</span>
              <span className="font-medium ml-2">{goals.weekly.jobs}</span>
            </div>
            <div>
              <span className="text-slate-500">Faturamento/semana:</span>
              <span className="font-medium ml-2">{formatCurrency(goals.weekly.revenue, true)}</span>
            </div>
            <div>
              <span className="text-slate-500">Marketing/ano:</span>
              <span className="font-medium ml-2">{formatCurrency(goals.annual.marketing, true)}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Taxa de fechamento: {settings.formulaParams.closingRate}% | Ticket medio: {formatCurrency(settings.formulaParams.avgTicket)} | {settings.formulaParams.productionWeeks} semanas de producao
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

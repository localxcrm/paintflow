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
  Sparkles,
  Loader2,
  Eye,
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

interface ThreeYearPicture {
  revenue?: string;
  profit?: string;
  measurables?: string[];
}

interface VTOSettings {
  annualTarget: number;
  formulaParams: FormulaParams;
  oneYearVision?: string;
  oneYearGoals?: string[];
  tenYearTarget?: string;
  threeYearPicture?: ThreeYearPicture | string;
}

const defaultSettings: VTOSettings = {
  annualTarget: 1000000,
  formulaParams: {
    avgTicket: 9500,
    closingRate: 30,
    marketingPercent: 8,
    productionWeeks: 35,
  },
  oneYearVision: '',
  oneYearGoals: [],
  tenYearTarget: '',
  threeYearPicture: { revenue: '', profit: '', measurables: [] },
};

export default function PainelPage() {
  const [period, setPeriod] = useState('month');
  const [settings, setSettings] = useState<VTOSettings>(defaultSettings);
  const [ytdRevenue, setYtdRevenue] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVTO, setIsLoadingVTO] = useState(true);

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

  // Load VTO from API
  useEffect(() => {
    const fetchVTO = async () => {
      try {
        setIsLoadingVTO(true);
        const res = await fetch('/api/vto');
        if (res.ok) {
          const data = await res.json();
          setSettings({
            annualTarget: data.annualTarget || defaultSettings.annualTarget,
            formulaParams: {
              ...defaultSettings.formulaParams,
              ...data.formulaParams,
            },
            oneYearVision: data.oneYearVision || '',
            oneYearGoals: data.oneYearGoals || [],
            tenYearTarget: data.tenYearTarget || '',
            threeYearPicture: data.threeYearPicture || { revenue: '', profit: '', measurables: [] },
          });
        }
      } catch (e) {
        console.error('Error loading VTO settings:', e);
      } finally {
        setIsLoadingVTO(false);
      }
    };
    fetchVTO();
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

  if (isLoading && isLoadingVTO) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D5C75]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel</h1>
          <p className="text-slate-500 font-medium">
            Bem-vindo ao centro de comando do seu negócio
          </p>
        </div>
        <Tabs value={period} onValueChange={setPeriod} className="glass p-1 rounded-xl shadow-inner">
          <TabsList className="bg-transparent border-none">
            <TabsTrigger value="week" className="data-[state=active]:bg-white data-[state=active]:text-brand-teal data-[state=active]:shadow-sm rounded-lg transition-all font-semibold">Semana</TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-white data-[state=active]:text-brand-teal data-[state=active]:shadow-sm rounded-lg transition-all font-semibold">Mes</TabsTrigger>
            <TabsTrigger value="quarter" className="data-[state=active]:bg-white data-[state=active]:text-brand-teal data-[state=active]:shadow-sm rounded-lg transition-all font-semibold">Trimestre</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Barra de Progresso da Meta Anual */}
      <Card variant="glass" className="border-white/40 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
          <Target className="w-32 h-32" />
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-teal/10 rounded-lg">
                <Target className="w-6 h-6 text-brand-teal" />
              </div>
              <span className="font-bold text-lg text-slate-800 tracking-tight">Progresso Meta Anual</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-0.5">Faturamento YTD</span>
                <span className="text-sm font-bold text-slate-700">
                  {formatCurrency(ytdRevenue, true)} <span className="text-slate-400 font-medium text-xs">/ {formatCurrency(settings.annualTarget, true)}</span>
                </span>
              </div>
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-brand-teal text-white font-bold text-sm shadow-lg shadow-brand-teal/20">
                {vtoProgress.toFixed(0)}%
              </div>
              <Link href="/metas">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100/50">
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-teal to-brand-teal-light transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(26,122,140,0.3)]"
              style={{ width: `${Math.min(vtoProgress, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Meu Foco e Meu Sonho - Cards lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meu Foco - Plano do Ano */}
        <Card variant="glass" className="border-brand-teal/20 bg-gradient-to-br from-brand-teal/5 to-transparent hover:shadow-brand-teal/5 hover:translate-y-[-2px] transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-orange/10 rounded-2xl shadow-inner shadow-brand-orange/5">
                  <Sparkles className="w-6 h-6 text-brand-orange animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-brand-teal tracking-tight">Meu Foco</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plano do Ano</p>
                </div>
              </div>
              <Link href="/metas">
                <Button variant="ghost" size="sm" className="font-bold text-brand-teal hover:bg-brand-teal/5">
                  Configurar <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            <div className="space-y-6">
              {settings.oneYearVision ? (
                <div className="relative p-4 bg-white/40 rounded-xl border border-white/60 shadow-inner">
                  <p className="text-lg text-slate-700 italic font-medium leading-relaxed">
                    &ldquo;{settings.oneYearVision}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-slate-200/50 rounded-xl text-center">
                  <p className="text-sm text-slate-400 font-medium italic">
                    Defina seu foco para o ano em Metas
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Principais Objetivos</p>
                <div className="grid gap-2">
                  {settings.oneYearGoals && settings.oneYearGoals.length > 0 ? (
                    settings.oneYearGoals.map((goal, index) => (
                      <div key={index} className="flex items-start gap-3 p-2 group hover:bg-white/30 rounded-lg transition-colors">
                        <div className="mt-1 w-4 h-4 rounded-full border-2 border-brand-orange flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                        </div>
                        <span className="text-sm text-slate-700 font-semibold group-hover:text-brand-teal transition-colors">{goal}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 pl-1">Nenhum objetivo definido</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meu Sonho - Visao de Longo Prazo */}
        <Card variant="glass" className="border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-pink-50/50 hover:shadow-purple-500/5 hover:translate-y-[-2px] transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-2xl shadow-inner">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-purple-700 tracking-tight">Meu Sonho</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Norte Magnético</p>
                </div>
              </div>
              <Link href="/metas">
                <Button variant="ghost" size="sm" className="font-bold text-purple-600 hover:bg-purple-100/50">
                  Ajustar <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            <div className="space-y-6">
              {/* Visao 3 Anos */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Onde estaremos em 3 anos</p>
                {(() => {
                  const picture = settings.threeYearPicture;
                  const hasContent = picture && (
                    typeof picture === 'string'
                      ? picture.trim() !== ''
                      : (picture.revenue || picture.profit)
                  );
                  const displayText = typeof picture === 'string'
                    ? picture
                    : picture?.revenue
                      ? `Faturamento: ${picture.revenue}${picture.profit ? ` | Lucro: ${picture.profit}` : ''}`
                      : '';

                  return hasContent ? (
                    <div className="p-4 bg-white/40 rounded-xl border border-white/60 shadow-inner">
                      <p className="text-base text-slate-700 italic font-medium">
                        &ldquo;{displayText}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-slate-200/50 rounded-xl text-center">
                      <p className="text-sm text-slate-400 italic">Defina sua visão de 3 anos</p>
                    </div>
                  );
                })()}
              </div>

              {/* Meta 10 Anos */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Meta de 10 Anos</p>
                {settings.tenYearTarget ? (
                  <div className="p-4 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-200 border border-purple-400">
                    <p className="text-base text-white font-bold leading-relaxed">
                      &ldquo;{settings.tenYearTarget}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div className="p-4 border-2 border-dashed border-purple-200/50 rounded-xl text-center">
                    <p className="text-sm text-slate-400 italic">Qual é o seu Everest?</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rocks e Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rocks do Trimestre */}
        <div className="lg:col-span-2">
          <Card variant="glass" className="h-full border-slate-200/40">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Mountain className="w-5 h-5 text-slate-600" />
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-800">Rocks Q{currentQuarter} {currentYear}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-tight">
                    {completedRocks}/{totalRocks} Concluídos
                  </span>
                  <Link href="/rocks">
                    <Button variant="ghost" size="sm" className="h-8 px-2 font-bold text-brand-teal">
                      Ver Todos
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quarterRocks.slice(0, 6).map((rock) => (
                  <div key={rock.id} className="flex items-center gap-3 p-3 bg-white/40 hover:bg-white/60 rounded-xl border border-white/60 transition-all group">
                    <button
                      className="shrink-0 transition-transform active:scale-95"
                      onClick={() =>
                        updateStatus(rock.id, rock.status === 'complete' ? 'on_track' : 'complete')
                      }
                    >
                      {rock.status === 'complete' ? (
                        <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center shadow-lg shadow-green-200">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-lg border-2 border-slate-300 group-hover:border-brand-teal transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${rock.status === 'complete' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {rock.title}
                      </p>
                      {rock.status !== 'complete' && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-teal rounded-full" style={{ width: `${rock.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{rock.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {quarterRocks.length === 0 && (
                  <div className="col-span-2 py-8 text-center text-slate-400 font-medium italic">
                    Nenhum rock para este trimestre. Foco na operação!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Atalhos de Venda</p>
          <Link href="/vendas?action=lead" className="block">
            <Button variant="premium" size="lg" className="w-full h-16 justify-between px-6 shadow-blue-500/10 hover:shadow-blue-500/20">
              <span className="flex items-center gap-3">
                <Plus className="w-6 h-6" />
                <span className="font-bold text-lg">Novo Lead</span>
              </span>
              <ArrowRight className="w-5 h-5 opacity-50" />
            </Button>
          </Link>
          <Link href="/vendas?action=sale" className="block">
            <Button variant="outline" size="lg" className="w-full h-16 justify-between px-6 bg-white shadow-xl hover:bg-slate-50 border-slate-200/50">
              <span className="flex items-center gap-3 text-slate-700">
                <TrendingUp className="w-6 h-6 text-brand-teal" />
                <span className="font-bold text-lg">Venda</span>
              </span>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </Button>
          </Link>

          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mt-6">Gestão & Treinamento</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/marketing">
              <Card className="p-4 hover:bg-white/60 transition-colors cursor-pointer border-slate-200/40 shadow-sm text-center">
                <Megaphone className="w-6 h-6 text-brand-orange mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700">Marketing</span>
              </Card>
            </Link>
            <Link href="/conhecimento">
              <Card className="p-4 hover:bg-white/60 transition-colors cursor-pointer border-slate-200/40 shadow-sm text-center">
                <FileText className="w-6 h-6 text-brand-teal mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700">Processos</span>
              </Card>
            </Link>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* ROI & Avaliações Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        <Card variant="glass" className="border-purple-200/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-800">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Megaphone className="w-5 h-5 text-purple-600" />
              </div>
              ROI de Marketing
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-black text-slate-800 tracking-tighter">
                  {formatCurrency(displayData.marketing.spent, true)}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investido</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-slate-800 tracking-tighter">
                  ${displayData.marketing.cpl.toFixed(0)}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custo/Lead</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-green-500 tracking-tighter">
                  {displayData.marketing.roi.toFixed(1)}x
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ROI</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-yellow-200/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-slate-800">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              Avaliações & Satisfação
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-end gap-2">
                <p className="text-5xl font-black text-slate-800 leading-none tracking-tighter">
                  {displayData.reviews.avgRating > 0
                    ? displayData.reviews.avgRating.toFixed(1)
                    : '5.0'}
                </p>
                <div className="flex flex-col mb-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${star <= Math.round(displayData.reviews.avgRating || 5)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-200'
                          }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Nota Média</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-800 tracking-tighter">{displayData.reviews.total}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total acumulado</p>
                <div className="mt-2 h-1.5 w-24 bg-slate-100 rounded-full ml-auto overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${(displayData.reviews.total / displayData.reviews.goal) * 100}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ProgressCard } from '@/components/dashboard/progress-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  FileText,
  TrendingUp,
  Megaphone,
  Star,
  Plus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  leads: { total: number; goal: number };
  estimates: { total: number; goal: number };
  sales: { total: number; goal: number; closingRate: number };
  revenue: { total: number; goal: number };
  marketing: { spent: number; cpl: number; roi: number };
  reviews: { total: number; goal: number; avgRating: number };
}

const defaultData: DashboardData = {
  leads: { total: 0, goal: 40 },
  estimates: { total: 0, goal: 40 },
  sales: { total: 0, goal: 12, closingRate: 0 },
  revenue: { total: 0, goal: 114000 },
  marketing: { spent: 0, cpl: 0, roi: 0 },
  reviews: { total: 0, goal: 10, avgRating: 0 },
};

export default function DashboardPage() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<DashboardData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/dashboard?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        // Map API response to our simplified data structure
        setData({
          leads: {
            total: json.leads?.total || 0,
            goal: period === 'week' ? 10 : period === 'month' ? 40 : 120,
          },
          estimates: {
            total: json.estimates?.total || 0,
            goal: period === 'week' ? 10 : period === 'month' ? 40 : 120,
          },
          sales: {
            total: json.jobs?.completed || 0,
            goal: period === 'week' ? 3 : period === 'month' ? 12 : 35,
            closingRate: json.salesFunnel?.closingRate || 0,
          },
          revenue: {
            total: json.financials?.totalRevenue || 0,
            goal: period === 'week' ? 28500 : period === 'month' ? 114000 : 333000,
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
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const periodLabel = period === 'week' ? 'Esta Semana' : period === 'month' ? 'Este Mês' : 'Este Trimestre';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Painel</h1>
          <p className="text-slate-500">Você está no caminho certo para R$ 1 milhão?</p>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="quarter">Trimestre</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

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
          current={data.leads.total}
          goal={data.leads.goal}
          icon={Users}
        />
        <ProgressCard
          title="Vendas"
          subtitle={`Taxa de fechamento: ${data.sales.closingRate.toFixed(0)}%`}
          current={data.sales.total}
          goal={data.sales.goal}
          icon={TrendingUp}
        />
        <ProgressCard
          title="Faturamento"
          subtitle={periodLabel}
          current={data.revenue.total}
          goal={data.revenue.goal}
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
                  R$ {data.marketing.spent.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-slate-500">Investido</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  R$ {data.marketing.cpl.toFixed(0)}
                </p>
                <p className="text-xs text-slate-500">Custo/Lead</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {data.marketing.roi.toFixed(1)}x
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
              Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-slate-900">
                  {data.reviews.avgRating > 0 ? data.reviews.avgRating.toFixed(1) : '-'}
                </p>
                <p className="text-sm text-slate-500">Nota média</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">
                  {data.reviews.total}
                </p>
                <p className="text-sm text-slate-500">
                  de {data.reviews.goal} avaliações
                </p>
              </div>
            </div>
            <div className="flex gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(data.reviews.avgRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formula Reminder */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Fórmula $1 Milhão</h3>
              <p className="text-sm text-blue-700 mt-1">
                10 leads/semana → 3 vendas/semana → R$ 28.500/semana → R$ 1M/ano
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Meta de fechamento: 30% | Ticket médio: R$ 9.500
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

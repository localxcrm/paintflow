'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Save, TrendingUp, Users, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface WeeklyEntry {
  id?: string;
  weekStart: string;
  leads: number;
  estimates: number;
  sales: number;
  revenue: number;
  createdAt?: string;
}

interface FormulaParams {
  avgTicket: number;
  closingRate: number;
  marketingPercent: number;
  productionWeeks: number;
}

interface VTOData {
  annualTarget: number;
  formulaParams: FormulaParams;
}

const defaultVTO: VTOData = {
  annualTarget: 1000000,
  formulaParams: {
    avgTicket: 9500,
    closingRate: 30,
    marketingPercent: 8,
    productionWeeks: 35,
  },
};

// Calculate goals based on annual revenue target and formula parameters
function calculateGoals(annualTarget: number, params: FormulaParams) {
  const { avgTicket, closingRate, productionWeeks } = params;

  const jobsPerYear = Math.round(annualTarget / avgTicket);
  const jobsPerWeek = jobsPerYear / productionWeeks;
  const leadsPerYear = Math.round(jobsPerYear / (closingRate / 100));
  const leadsPerWeek = Math.round(leadsPerYear / productionWeeks);
  const revenuePerWeek = annualTarget / productionWeeks;

  return {
    monthly: {
      revenue: Math.round(annualTarget / 12),
      jobs: Math.round(jobsPerYear / 12),
      leads: Math.round(leadsPerYear / 12),
    },
    weekly: {
      revenue: Math.round(revenuePerWeek),
      jobs: Math.round(jobsPerWeek * 10) / 10,
      leads: leadsPerWeek,
    },
  };
}

function formatCurrency(value: number, compact = false) {
  if (compact && value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString('en-US')}`;
}

const currentYear = new Date().getFullYear();
const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getWeeksInMonth(year: number, month: number) {
  const weeks: { start: Date; end: Date; label: string }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let currentStart = new Date(firstDay);
  // Adjust to Monday
  const dayOfWeek = currentStart.getDay();
  if (dayOfWeek !== 1) {
    currentStart.setDate(currentStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  }

  while (currentStart <= lastDay) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6);

    weeks.push({
      start: new Date(currentStart),
      end: currentEnd,
      label: `${currentStart.getDate()}/${currentStart.getMonth() + 1} - ${currentEnd.getDate()}/${currentEnd.getMonth() + 1}`,
    });

    currentStart.setDate(currentStart.getDate() + 7);
  }

  return weeks;
}

export default function VendasPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [entries, setEntries] = useState<WeeklyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [vto, setVto] = useState<VTOData>(defaultVTO);
  const [formData, setFormData] = useState<WeeklyEntry>({
    weekStart: '',
    leads: 0,
    estimates: 0,
    sales: 0,
    revenue: 0,
  });

  const weeks = getWeeksInMonth(selectedYear, selectedMonth);
  const goals = calculateGoals(vto.annualTarget, vto.formulaParams);

  // Load VTO settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('paintpro_vto');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVto({
          ...defaultVTO,
          ...parsed,
          formulaParams: {
            ...defaultVTO.formulaParams,
            ...parsed.formulaParams,
          },
        });
      } catch (e) {
        console.error('Error loading VTO:', e);
      }
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [selectedMonth, selectedYear]);

  const fetchEntries = async () => {
    // TODO: Fetch from API
    setIsLoading(true);
    try {
      // Simulated data for now
      setEntries([]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Save to API
      const newEntry = { ...formData, id: Date.now().toString() };
      setEntries([...entries, newEntry]);
      setFormData({ weekStart: '', leads: 0, estimates: 0, sales: 0, revenue: 0 });
      setShowForm(false);
      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const totals = entries.reduce(
    (acc, entry) => ({
      leads: acc.leads + entry.leads,
      estimates: acc.estimates + entry.estimates,
      sales: acc.sales + entry.sales,
      revenue: acc.revenue + entry.revenue,
    }),
    { leads: 0, estimates: 0, sales: 0, revenue: 0 }
  );

  // Calculate conversion rates
  const conversionRates = {
    leadToEstimate: totals.leads > 0
      ? Math.round((totals.estimates / totals.leads) * 100)
      : 0,
    estimateToSale: totals.estimates > 0
      ? Math.round((totals.sales / totals.estimates) * 100)
      : 0,
  };

  // Monthly goals from VTO settings
  const monthlyGoals = {
    leads: goals.monthly.leads,
    estimates: goals.monthly.leads, // Same as leads (every lead should get an estimate)
    sales: goals.monthly.jobs,
    revenue: goals.monthly.revenue,
  };

  // Weekly goals from VTO settings
  const weeklyGoals = {
    leads: goals.weekly.leads,
    estimates: goals.weekly.leads,
    sales: goals.weekly.jobs,
    revenue: goals.weekly.revenue,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendas</h1>
          <p className="text-slate-500">Registre seus números semanais</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.leads}</p>
                <p className="text-xs text-slate-500">de {monthlyGoals.leads} leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.estimates}</p>
                <p className="text-xs text-slate-500">de {monthlyGoals.estimates} orçamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.sales}</p>
                <p className="text-xs text-slate-500">de {monthlyGoals.sales} vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totals.revenue, true)}</p>
                <p className="text-xs text-slate-500">de {formatCurrency(monthlyGoals.revenue, true)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Lead → Orçamento</p>
                <p className="text-2xl font-bold text-blue-600">{conversionRates.leadToEstimate}%</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>{totals.leads} leads</p>
                <p>{totals.estimates} orçamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Orçamento → Venda</p>
                <p className="text-2xl font-bold text-green-600">{conversionRates.estimateToSale}%</p>
                <p className="text-xs text-slate-400">Meta: {vto.formulaParams.closingRate}%</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>{totals.estimates} orçamentos</p>
                <p>{totals.sales} vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Entry Form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>Semana</Label>
                  <Select
                    value={formData.weekStart}
                    onValueChange={(v) => setFormData({ ...formData, weekStart: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {weeks.map((week, i) => (
                        <SelectItem key={i} value={week.start.toISOString()}>
                          {week.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Leads</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.leads}
                    onChange={(e) => setFormData({ ...formData, leads: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Orçamentos</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.estimates}
                    onChange={(e) => setFormData({ ...formData, estimates: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Vendas</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sales}
                    onChange={(e) => setFormData({ ...formData, sales: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Faturamento ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.revenue}
                    onChange={(e) => setFormData({ ...formData, revenue: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Semana
        </Button>
      )}

      {/* Weekly Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {months[selectedMonth]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Semana</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Orçamentos</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Taxa Fech.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    Nenhum dado registrado para este mês.
                    <br />
                    <span className="text-sm">Clique em &quot;Adicionar Semana&quot; para começar.</span>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const closingRate = entry.estimates > 0
                    ? ((entry.sales / entry.estimates) * 100).toFixed(0)
                    : '0';
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {new Date(entry.weekStart).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right">{entry.leads}</TableCell>
                      <TableCell className="text-right">{entry.estimates}</TableCell>
                      <TableCell className="text-right">{entry.sales}</TableCell>
                      <TableCell className="text-right">
                        ${entry.revenue.toLocaleString('en-US')}
                      </TableCell>
                      <TableCell className="text-right">{closingRate}%</TableCell>
                    </TableRow>
                  );
                })
              )}
              {entries.length > 0 && (
                <TableRow className="font-bold bg-slate-50">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{totals.leads}</TableCell>
                  <TableCell className="text-right">{totals.estimates}</TableCell>
                  <TableCell className="text-right">{totals.sales}</TableCell>
                  <TableCell className="text-right">
                    ${totals.revenue.toLocaleString('en-US')}
                  </TableCell>
                  <TableCell className="text-right">
                    {totals.estimates > 0
                      ? ((totals.sales / totals.estimates) * 100).toFixed(0)
                      : '0'}%
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Weekly Goals Reference */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-700">Metas Semanais</h3>
            <a href="/goals" className="text-sm text-blue-600 hover:underline">
              Editar em Metas →
            </a>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Baseado em: Meta de {formatCurrency(vto.annualTarget)} / {vto.formulaParams.productionWeeks} semanas
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Leads:</span>
              <span className="font-medium ml-2">{weeklyGoals.leads}/semana</span>
            </div>
            <div>
              <span className="text-slate-500">Orçamentos:</span>
              <span className="font-medium ml-2">{weeklyGoals.estimates}/semana</span>
            </div>
            <div>
              <span className="text-slate-500">Vendas:</span>
              <span className="font-medium ml-2">{weeklyGoals.sales}/semana</span>
            </div>
            <div>
              <span className="text-slate-500">Faturamento:</span>
              <span className="font-medium ml-2">{formatCurrency(weeklyGoals.revenue)}/semana</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

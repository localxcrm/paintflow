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
  channels?: Record<ChannelId, ChannelData>;
  createdAt?: string;
}

// Sales channels
const SALES_CHANNELS = [
  { id: 'google', label: 'Google Ads', color: 'bg-blue-500' },
  { id: 'facebook', label: 'Facebook/Meta', color: 'bg-indigo-500' },
  { id: 'referral', label: 'Indicação', color: 'bg-green-500' },
  { id: 'yard_sign', label: 'Placa de Obra', color: 'bg-yellow-500' },
  { id: 'door_knock', label: 'Door Knock', color: 'bg-orange-500' },
  { id: 'repeat', label: 'Cliente Repetido', color: 'bg-purple-500' },
  { id: 'other', label: 'Outro', color: 'bg-slate-500' },
] as const;

type ChannelId = typeof SALES_CHANNELS[number]['id'];

interface ChannelData {
  leads: number;
  estimates: number;
  sales: number;
  revenue: number;
}

interface FormulaParams {
  avgTicket: number;
  leadConversionRate: number; // Lead → Estimate %
  closingRate: number; // Estimate → Sale %
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
    leadConversionRate: 85,
    closingRate: 30,
    marketingPercent: 8,
    productionWeeks: 35,
  },
};

// Calculate goals based on annual revenue target and formula parameters
function calculateGoals(annualTarget: number, params: FormulaParams) {
  const { avgTicket, leadConversionRate, closingRate, productionWeeks } = params;

  const jobsPerYear = Math.round(annualTarget / avgTicket);
  const jobsPerWeek = jobsPerYear / productionWeeks;

  // Calculate estimates needed based on closing rate (Estimate → Sale)
  const estimatesPerYear = Math.round(jobsPerYear / (closingRate / 100));

  // Calculate leads needed based on lead conversion rate (Lead → Estimate)
  const leadsPerYear = Math.round(estimatesPerYear / (leadConversionRate / 100));
  const leadsPerWeek = Math.round(leadsPerYear / productionWeeks);
  const estimatesPerWeek = Math.round(estimatesPerYear / productionWeeks);

  const revenuePerWeek = annualTarget / productionWeeks;

  return {
    monthly: {
      revenue: Math.round(annualTarget / 12),
      jobs: Math.round(jobsPerYear / 12),
      estimates: Math.round(estimatesPerYear / 12),
      leads: Math.round(leadsPerYear / 12),
    },
    weekly: {
      revenue: Math.round(revenuePerWeek),
      jobs: Math.round(jobsPerWeek * 10) / 10,
      estimates: estimatesPerWeek,
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
  const [selectedWeek, setSelectedWeek] = useState<string>(''); // Currently selected week for editing
  const [vto, setVto] = useState<VTOData>(defaultVTO);

  // Channel data state - now tracks edits for the current selected week
  // Initialize with zeroed structure
  const [currentChannelData, setCurrentChannelData] = useState<Record<ChannelId, ChannelData>>(() => {
    const initial: Partial<Record<ChannelId, ChannelData>> = {};
    SALES_CHANNELS.forEach((ch) => {
      initial[ch.id] = { leads: 0, estimates: 0, sales: 0, revenue: 0 };
    });
    return initial as Record<ChannelId, ChannelData>;
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

  // Load entries (simulating local storage persistence for historical data for now)
  useEffect(() => {
    // In a real app, this would fetch from DB based on month/year
    const savedEntries = localStorage.getItem('paintflow_sales_entries');
    if (savedEntries) {
      try {
        const parsed = JSON.parse(savedEntries);
        // Filter for current month/year view if needed, but for now we just load all
        // to simplify the "save" logic finding existing entries
        setEntries(parsed);
      } catch (e) {
        console.error('Error loading entries:', e);
      }
    }
  }, []);

  // When selected week changes, load its data into currentChannelData
  useEffect(() => {
    if (!selectedWeek) return;

    const existingEntry = entries.find(e => e.weekStart === selectedWeek);

    // Reset to zeros first
    const newChannelData: Partial<Record<ChannelId, ChannelData>> = {};
    SALES_CHANNELS.forEach((ch) => {
      newChannelData[ch.id] = { leads: 0, estimates: 0, sales: 0, revenue: 0 };
    });

    if (existingEntry && existingEntry.channels) {
      // Load existing data
      setChannelData(existingEntry.channels);
    } else {
      // New week or no channel data, use zeros
      setChannelData(newChannelData as Record<ChannelId, ChannelData>);
    }
  }, [selectedWeek, entries]);

  // Helper to update channel data state
  const setChannelData = (data: Record<ChannelId, ChannelData>) => {
    setCurrentChannelData(data);
  };

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

  // Save current week data
  const handleSaveWeek = async () => {
    if (!selectedWeek) {
      toast.error('Selecione uma semana');
      return;
    }

    setIsLoading(true);

    try {
      // Calculate totals from channels
      const totals = Object.values(currentChannelData).reduce(
        (acc, curr) => ({
          leads: acc.leads + curr.leads,
          estimates: acc.estimates + curr.estimates,
          sales: acc.sales + curr.sales,
          revenue: acc.revenue + curr.revenue,
        }),
        { leads: 0, estimates: 0, sales: 0, revenue: 0 }
      );

      // Create or update entry
      const newEntry: WeeklyEntry = {
        id: entries.find(e => e.weekStart === selectedWeek)?.id || Date.now().toString(),
        weekStart: selectedWeek,
        ...totals,
        channels: currentChannelData,
        createdAt: new Date().toISOString(),
      };

      // Update entries list
      const updatedEntries = [
        ...entries.filter(e => e.weekStart !== selectedWeek),
        newEntry
      ];

      setEntries(updatedEntries);

      // Persist to local storage
      localStorage.setItem('paintflow_sales_entries', JSON.stringify(updatedEntries));

      toast.success('Dados da semana salvos!');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Channel totals for display
  const channelTotals = SALES_CHANNELS.map((ch) => ({
    ...ch,
    data: currentChannelData[ch.id],
    conversionRate: currentChannelData[ch.id].estimates > 0
      ? Math.round((currentChannelData[ch.id].sales / currentChannelData[ch.id].estimates) * 100)
      : 0,
  }));

  const updateChannelData = (channelId: ChannelId, field: keyof ChannelData, value: number) => {
    const updated = {
      ...currentChannelData,
      [channelId]: {
        ...currentChannelData[channelId],
        [field]: value,
      },
    };
    setCurrentChannelData(updated);
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
    estimates: goals.monthly.estimates,
    sales: goals.monthly.jobs,
    revenue: goals.monthly.revenue,
  };

  // Weekly goals from VTO settings
  const weeklyGoals = {
    leads: goals.weekly.leads,
    estimates: goals.weekly.estimates,
    sales: goals.weekly.jobs,
    revenue: goals.weekly.revenue,
  };

  // Channel totals (removed duplicates)

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

      {/* Unified Input Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg">Registro Semanal</CardTitle>
            <div className="flex items-center gap-2">
              <Label>Semana:</Label>
              <Select
                value={selectedWeek}
                onValueChange={(v) => setSelectedWeek(v)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione a semana..." />
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
          </div>
        </CardHeader>
        <CardContent>
          {!selectedWeek ? (
            <div className="text-center py-8 text-slate-500">
              Selecione uma semana acima para registrar os dados por canal.
            </div>
          ) : (
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Canal</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead className="text-center">Orçamentos</TableHead>
                    <TableHead className="text-center">Vendas</TableHead>
                    <TableHead className="text-center">Faturamento</TableHead>
                    <TableHead className="text-center">Taxa Fech.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channelTotals.map((ch) => (
                    <TableRow key={ch.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${ch.color}`} />
                          {ch.label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="w-16 text-center h-8"
                          value={ch.data.leads || ''}
                          onChange={(e) => updateChannelData(ch.id, 'leads', parseInt(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="w-16 text-center h-8"
                          value={ch.data.estimates || ''}
                          onChange={(e) => updateChannelData(ch.id, 'estimates', parseInt(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="w-16 text-center h-8"
                          value={ch.data.sales || ''}
                          onChange={(e) => updateChannelData(ch.id, 'sales', parseInt(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="w-24 text-center h-8"
                          value={ch.data.revenue || ''}
                          onChange={(e) => updateChannelData(ch.id, 'revenue', parseInt(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {ch.conversionRate}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="font-bold bg-slate-50">
                    <TableCell>Total da Semana</TableCell>
                    <TableCell className="text-center">
                      {channelTotals.reduce((sum, ch) => sum + ch.data.leads, 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      {channelTotals.reduce((sum, ch) => sum + ch.data.estimates, 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      {channelTotals.reduce((sum, ch) => sum + ch.data.sales, 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      ${channelTotals.reduce((sum, ch) => sum + ch.data.revenue, 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const totalEst = channelTotals.reduce((sum, ch) => sum + ch.data.estimates, 0);
                        const totalSales = channelTotals.reduce((sum, ch) => sum + ch.data.sales, 0);
                        return totalEst > 0 ? Math.round((totalSales / totalEst) * 100) : 0;
                      })()}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button onClick={handleSaveWeek} disabled={isLoading} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Semana
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Histórico: {months[selectedMonth]} {selectedYear}
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Channel Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resultados por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Canal</TableHead>
                <TableHead className="text-center">Leads</TableHead>
                <TableHead className="text-center">Orçamentos</TableHead>
                <TableHead className="text-center">Vendas</TableHead>
                <TableHead className="text-center">Faturamento</TableHead>
                <TableHead className="text-center">Taxa Fech.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channelTotals.map((ch) => (
                <TableRow key={ch.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${ch.color}`} />
                      {ch.label}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center h-8"
                      value={ch.data.leads || ''}
                      onChange={(e) => updateChannelData(ch.id, 'leads', parseInt(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center h-8"
                      value={ch.data.estimates || ''}
                      onChange={(e) => updateChannelData(ch.id, 'estimates', parseInt(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center h-8"
                      value={ch.data.sales || ''}
                      onChange={(e) => updateChannelData(ch.id, 'sales', parseInt(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      className="w-24 text-center h-8"
                      value={ch.data.revenue || ''}
                      onChange={(e) => updateChannelData(ch.id, 'revenue', parseInt(e.target.value) || 0)}
                    />
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {ch.conversionRate}%
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals Row */}
              <TableRow className="font-bold bg-slate-50">
                <TableCell>Total</TableCell>
                <TableCell className="text-center">
                  {channelTotals.reduce((sum, ch) => sum + ch.data.leads, 0)}
                </TableCell>
                <TableCell className="text-center">
                  {channelTotals.reduce((sum, ch) => sum + ch.data.estimates, 0)}
                </TableCell>
                <TableCell className="text-center">
                  {channelTotals.reduce((sum, ch) => sum + ch.data.sales, 0)}
                </TableCell>
                <TableCell className="text-center">
                  ${channelTotals.reduce((sum, ch) => sum + ch.data.revenue, 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  {(() => {
                    const totalEst = channelTotals.reduce((sum, ch) => sum + ch.data.estimates, 0);
                    const totalSales = channelTotals.reduce((sum, ch) => sum + ch.data.sales, 0);
                    return totalEst > 0 ? Math.round((totalSales / totalEst) * 100) : 0;
                  })()}%
                </TableCell>
              </TableRow>
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

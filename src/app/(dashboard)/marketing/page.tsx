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
import { Plus, Save, Megaphone, TrendingUp, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';

interface MarketingEntry {
  id?: string;
  source: string;
  month: number;
  year: number;
  amount: number;
  leads: number;
}

const currentYear = new Date().getFullYear();
const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const marketingSources = [
  'Google Ads',
  'Facebook/Instagram',
  'Placas de Obra',
  'Indicações',
  'Site/SEO',
  'Outros',
];

export default function MarketingPage() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [entries, setEntries] = useState<MarketingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<MarketingEntry>({
    source: '',
    month: new Date().getMonth() + 1,
    year: currentYear,
    amount: 0,
    leads: 0,
  });

  useEffect(() => {
    fetchEntries();
  }, [selectedYear]);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/marketing-spend?year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.spends || []);
      }
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
      const res = await fetch('/api/marketing-spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchEntries();
        setFormData({
          source: '',
          month: new Date().getMonth() + 1,
          year: currentYear,
          amount: 0,
          leads: 0,
        });
        setShowForm(false);
        toast.success('Dados salvos com sucesso!');
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      toast.error('Erro ao salvar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals by source
  const totalsBySource = entries.reduce((acc, entry) => {
    if (!acc[entry.source]) {
      acc[entry.source] = { amount: 0, leads: 0 };
    }
    acc[entry.source].amount += entry.amount;
    acc[entry.source].leads += entry.leads || 0;
    return acc;
  }, {} as Record<string, { amount: number; leads: number }>);

  const grandTotal = Object.values(totalsBySource).reduce(
    (acc, val) => ({ amount: acc.amount + val.amount, leads: acc.leads + val.leads }),
    { amount: 0, leads: 0 }
  );

  const avgCPL = grandTotal.leads > 0 ? grandTotal.amount / grandTotal.leads : 0;

  // Group entries by month
  const entriesByMonth = entries.reduce((acc, entry) => {
    if (!acc[entry.month]) {
      acc[entry.month] = [];
    }
    acc[entry.month].push(entry);
    return acc;
  }, {} as Record<number, MarketingEntry[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
          <p className="text-slate-500">Acompanhe seus investimentos em marketing</p>
        </div>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${(grandTotal.amount / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-slate-500">Total investido</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{grandTotal.leads}</p>
                <p className="text-xs text-slate-500">Leads gerados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Megaphone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${avgCPL.toFixed(0)}</p>
                <p className="text-xs text-slate-500">Custo por lead</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {grandTotal.amount > 0 ? ((grandTotal.leads * 9500 * 0.3) / grandTotal.amount).toFixed(1) : '0'}x
                </p>
                <p className="text-xs text-slate-500">ROI estimado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Entry Form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Investimento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>Fonte</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(v) => setFormData({ ...formData, source: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {marketingSources.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mês</Label>
                  <Select
                    value={formData.month.toString()}
                    onValueChange={(v) => setFormData({ ...formData, month: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, i) => (
                        <SelectItem key={i} value={(i + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Leads Gerados</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.leads}
                    onChange={(e) => setFormData({ ...formData, leads: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex gap-2 w-full">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Investimento
        </Button>
      )}

      {/* Performance by Source */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance por Fonte</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fonte</TableHead>
                <TableHead className="text-right">Investido</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(totalsBySource).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    Nenhum dado registrado para este ano.
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(totalsBySource).map(([source, data]) => (
                  <TableRow key={source}>
                    <TableCell className="font-medium">{source}</TableCell>
                    <TableCell className="text-right">
                      ${data.amount.toLocaleString('en-US')}
                    </TableCell>
                    <TableCell className="text-right">{data.leads}</TableCell>
                    <TableCell className="text-right">
                      ${data.leads > 0 ? (data.amount / data.leads).toFixed(0) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {grandTotal.amount > 0
                        ? ((data.amount / grandTotal.amount) * 100).toFixed(0)
                        : '0'}%
                    </TableCell>
                  </TableRow>
                ))
              )}
              {Object.entries(totalsBySource).length > 0 && (
                <TableRow className="font-bold bg-slate-50">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">
                    ${grandTotal.amount.toLocaleString('en-US')}
                  </TableCell>
                  <TableCell className="text-right">{grandTotal.leads}</TableCell>
                  <TableCell className="text-right">${avgCPL.toFixed(0)}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Investimento Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Investido</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">CPL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(entriesByMonth).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                    Nenhum dado registrado.
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(entriesByMonth)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([month, monthEntries]) => {
                    const monthTotal = monthEntries.reduce(
                      (acc, e) => ({ amount: acc.amount + e.amount, leads: acc.leads + (e.leads || 0) }),
                      { amount: 0, leads: 0 }
                    );
                    return (
                      <TableRow key={month}>
                        <TableCell className="font-medium">
                          {months[parseInt(month) - 1]}
                        </TableCell>
                        <TableCell className="text-right">
                          ${monthTotal.amount.toLocaleString('en-US')}
                        </TableCell>
                        <TableCell className="text-right">{monthTotal.leads}</TableCell>
                        <TableCell className="text-right">
                          ${monthTotal.leads > 0 ? (monthTotal.amount / monthTotal.leads).toFixed(0) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reference */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-700 mb-2">Meta de Marketing (Fórmula $1M)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Investimento anual:</span>
              <span className="font-medium ml-2">$80,000</span>
            </div>
            <div>
              <span className="text-slate-500">CPL meta:</span>
              <span className="font-medium ml-2">~$230/lead</span>
            </div>
            <div>
              <span className="text-slate-500">ROI esperado:</span>
              <span className="font-medium ml-2">10x ou mais</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

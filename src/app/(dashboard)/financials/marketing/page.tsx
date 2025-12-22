'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, DollarSign, TrendingUp, Target, Megaphone, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const LEAD_SOURCES = [
  'Google PPC',
  'Facebook Ads',
  'Yard Signs',
  'Referrals',
  'Home Advisor',
  'Angi',
  'Nextdoor',
  'SEO/Organic',
  'Direct Mail',
  'Other',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface MarketingSpend {
  id: string;
  source: string;
  amount: number;
  month: number;
  year: number;
  notes?: string;
}

export default function MarketingSpendPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [spends, setSpends] = useState<MarketingSpend[]>([]);
  const [totalBySource, setTotalBySource] = useState<Record<string, number>>({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    month: new Date().getMonth() + 1,
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/marketing-spend?year=${year}`);
      const data = await res.json();
      setSpends(data.spends || []);
      setTotalBySource(data.totalBySource || {});
      setGrandTotal(data.grandTotal || 0);
    } catch (error) {
      console.error('Error fetching marketing spend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/marketing-spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          year,
        }),
      });
      setDialogOpen(false);
      setFormData({ source: '', amount: '', month: new Date().getMonth() + 1, notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving marketing spend:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await fetch(`/api/marketing-spend?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const pieData = Object.entries(totalBySource).map(([source, amount]) => ({
    name: source,
    value: amount,
  }));

  // Group spends by month
  const spendsByMonth: Record<number, MarketingSpend[]> = {};
  spends.forEach(spend => {
    if (!spendsByMonth[spend.month]) spendsByMonth[spend.month] = [];
    spendsByMonth[spend.month].push(spend);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing Spend</h1>
          <p className="text-slate-500">Track your marketing investment by source</p>
        </div>
        <div className="flex gap-2">
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Spend</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Marketing Spend</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Source</Label>
                  <Select value={formData.source} onValueChange={(v) => setFormData({...formData, source: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Month</Label>
                  <Select value={formData.month.toString()} onValueChange={(v) => setFormData({...formData, month: parseInt(v)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month, i) => (
                        <SelectItem key={month} value={(i + 1).toString()}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Campaign details..."
                  />
                </div>
                <Button type="submit" className="w-full">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Total Spend YTD</p>
                <p className="text-2xl font-bold">{formatCurrency(grandTotal)}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Monthly Average</p>
                <p className="text-2xl font-bold">{formatCurrency(grandTotal / 12)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Active Sources</p>
                <p className="text-2xl font-bold">{Object.keys(totalBySource).length}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Megaphone className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Top Source</p>
                <p className="text-lg font-bold truncate">
                  {Object.entries(totalBySource).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spend by Source</CardTitle>
            <CardDescription>Distribution of marketing budget</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Source Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Source Breakdown</CardTitle>
            <CardDescription>Total spend by marketing channel</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(totalBySource)
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, amount]) => (
                    <TableRow key={source}>
                      <TableCell className="font-medium">{source}</TableCell>
                      <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                      <TableCell className="text-right">
                        {grandTotal > 0 ? ((amount / grandTotal) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                {Object.keys(totalBySource).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500">
                      No spending recorded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Detail</CardTitle>
          <CardDescription>All marketing spend entries for {year}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spends.length > 0 ? spends.map(spend => (
                <TableRow key={spend.id}>
                  <TableCell>{MONTHS[spend.month - 1]}</TableCell>
                  <TableCell className="font-medium">{spend.source}</TableCell>
                  <TableCell className="text-right">{formatCurrency(spend.amount)}</TableCell>
                  <TableCell className="text-slate-500">{spend.notes || '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(spend.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    No entries yet. Click "Add Spend" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

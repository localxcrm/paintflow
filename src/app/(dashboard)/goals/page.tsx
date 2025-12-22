'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Target, TrendingUp, Calendar, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface MonthlyTarget {
  id?: string;
  month: number;
  year: number;
  quarter: number;
  leadsGoal: number;
  leadsActual: number;
  appointmentsGoal: number;
  appointmentsActual: number;
  salesGoal: number;
  salesActual: number;
  salesValueGoal: number;
  salesValueActual: number;
  revenueGoal: number;
  revenueActual: number;
  grossProfitGoal: number;
  grossProfitActual: number;
  reviewsGoal: number;
  reviewsActual: number;
  marketingSpendGoal: number;
  marketingSpendActual: number;
}

export default function GoalsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);
  const [yearlyTotals, setYearlyTotals] = useState<Record<string, number>>({});
  const [annualGoals, setAnnualGoals] = useState({
    leads: 800,
    sales: 250,
    revenue: 1000000,
    grossProfit: 450000,
    reviews: 100,
    marketingSpend: 100000,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/targets?type=monthly&year=${year}`);
      const data = await res.json();
      setTargets(data.targets || []);
      setYearlyTotals(data.yearlyTotals || {});
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTargets = async () => {
    setIsSaving(true);
    try {
      // First initialize seasonal curves
      await fetch('/api/seasonal-curves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
      });

      // Then generate targets
      await fetch('/api/targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, annualGoals }),
      });

      fetchData();
    } catch (error) {
      console.error('Error generating targets:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTarget = async (month: number, field: string, value: number) => {
    const target = targets.find(t => t.month === month) || {
      month,
      year,
      quarter: Math.ceil(month / 3),
    };

    try {
      await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...target,
          [field]: value,
          type: 'monthly',
        }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating target:', error);
    }
  };

  const getProgressColor = (actual: number, goal: number) => {
    if (goal === 0) return 'bg-slate-200';
    const pct = (actual / goal) * 100;
    if (pct >= 100) return 'bg-green-500';
    if (pct >= 75) return 'bg-blue-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getProgressPct = (actual: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min((actual / goal) * 100, 100);
  };

  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Goals & Targets</h1>
          <p className="text-slate-500">Set and track your business goals</p>
        </div>
        <div className="flex gap-2">
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="setup">Annual Setup</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* YTD Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Leads', goalKey: 'leadsGoal', actualKey: 'leadsActual', format: (v: number) => v.toString() },
              { label: 'Sales', goalKey: 'salesGoal', actualKey: 'salesActual', format: (v: number) => v.toString() },
              { label: 'Revenue', goalKey: 'revenueGoal', actualKey: 'revenueActual', format: formatCurrency },
              { label: 'Gross Profit', goalKey: 'grossProfitGoal', actualKey: 'grossProfitActual', format: formatCurrency },
              { label: 'Reviews', goalKey: 'reviewsGoal', actualKey: 'reviewsActual', format: (v: number) => v.toString() },
              { label: 'Marketing Spend', goalKey: 'marketingSpendGoal', actualKey: 'marketingSpendActual', format: formatCurrency },
            ].map((metric) => {
              const goal = yearlyTotals[metric.goalKey] || 0;
              const actual = yearlyTotals[metric.actualKey] || 0;
              const pct = getProgressPct(actual, goal);
              const isOnTrack = pct >= (currentMonth / 12) * 100 * 0.9;

              return (
                <Card key={metric.label}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-slate-500">{metric.label}</p>
                      {isOnTrack ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-2xl font-bold">{metric.format(actual)}</p>
                      <p className="text-sm text-slate-500">/ {metric.format(goal)}</p>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-slate-400 mt-1">{pct.toFixed(0)}% of annual goal</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Monthly Progress Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Progress</CardTitle>
              <CardDescription>Goals vs Actuals by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white">Month</TableHead>
                      <TableHead className="text-center">Leads</TableHead>
                      <TableHead className="text-center">Sales</TableHead>
                      <TableHead className="text-center">Revenue</TableHead>
                      <TableHead className="text-center">Gross Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MONTHS.map((month, i) => {
                      const target = targets.find(t => t.month === i + 1);
                      const isPast = i + 1 < currentMonth;
                      const isCurrent = i + 1 === currentMonth;

                      return (
                        <TableRow key={month} className={cn(isCurrent && 'bg-blue-50')}>
                          <TableCell className={cn("font-medium sticky left-0", isCurrent ? 'bg-blue-50' : 'bg-white')}>
                            {month}
                            {isCurrent && <span className="ml-2 text-xs text-blue-600">(Current)</span>}
                          </TableCell>
                          {[
                            { g: target?.leadsGoal || 0, a: target?.leadsActual || 0 },
                            { g: target?.salesGoal || 0, a: target?.salesActual || 0 },
                            { g: target?.revenueGoal || 0, a: target?.revenueActual || 0, currency: true },
                            { g: target?.grossProfitGoal || 0, a: target?.grossProfitActual || 0, currency: true },
                          ].map((cell, j) => (
                            <TableCell key={j} className="text-center">
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <span className={cn(
                                    'font-medium',
                                    isPast && cell.a >= cell.g && 'text-green-600',
                                    isPast && cell.a < cell.g && 'text-red-600'
                                  )}>
                                    {cell.currency ? formatCurrency(cell.a) : cell.a}
                                  </span>
                                  <span className="text-slate-400"> / {cell.currency ? formatCurrency(cell.g) : cell.g}</span>
                                </div>
                                <Progress
                                  value={getProgressPct(cell.a, cell.g)}
                                  className="h-1"
                                />
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Annual Goals for {year}</CardTitle>
              <CardDescription>Set your annual targets and generate monthly breakdowns with seasonal weighting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label>Annual Leads Target</Label>
                  <Input
                    type="number"
                    value={annualGoals.leads}
                    onChange={(e) => setAnnualGoals({...annualGoals, leads: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Annual Sales Target (#)</Label>
                  <Input
                    type="number"
                    value={annualGoals.sales}
                    onChange={(e) => setAnnualGoals({...annualGoals, sales: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Annual Revenue Target ($)</Label>
                  <Input
                    type="number"
                    value={annualGoals.revenue}
                    onChange={(e) => setAnnualGoals({...annualGoals, revenue: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Annual Gross Profit Target ($)</Label>
                  <Input
                    type="number"
                    value={annualGoals.grossProfit}
                    onChange={(e) => setAnnualGoals({...annualGoals, grossProfit: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Annual Reviews Target</Label>
                  <Input
                    type="number"
                    value={annualGoals.reviews}
                    onChange={(e) => setAnnualGoals({...annualGoals, reviews: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>Annual Marketing Budget ($)</Label>
                  <Input
                    type="number"
                    value={annualGoals.marketingSpend}
                    onChange={(e) => setAnnualGoals({...annualGoals, marketingSpend: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Derived Metrics (based on your inputs)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Closing Rate</p>
                    <p className="font-medium">{annualGoals.leads > 0 ? ((annualGoals.sales / annualGoals.leads) * 100).toFixed(1) : 0}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Avg Sale Value</p>
                    <p className="font-medium">{annualGoals.sales > 0 ? formatCurrency(annualGoals.revenue / annualGoals.sales) : '$0'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Gross Margin</p>
                    <p className="font-medium">{annualGoals.revenue > 0 ? ((annualGoals.grossProfit / annualGoals.revenue) * 100).toFixed(1) : 0}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Marketing ROI</p>
                    <p className="font-medium">{annualGoals.marketingSpend > 0 ? (annualGoals.revenue / annualGoals.marketingSpend).toFixed(1) : 0}:1</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleGenerateTargets} disabled={isSaving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Generating...' : 'Generate Monthly Targets (with seasonal weighting)'}
              </Button>

              <p className="text-sm text-slate-500 text-center">
                This will create monthly targets using industry-standard seasonal weights for painting businesses
                (higher in spring/summer, lower in winter).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Monthly Targets</CardTitle>
              <CardDescription>Fine-tune individual month targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Leads Goal</TableHead>
                      <TableHead>Sales Goal</TableHead>
                      <TableHead>Revenue Goal</TableHead>
                      <TableHead>GP Goal</TableHead>
                      <TableHead>Reviews Goal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MONTHS.map((month, i) => {
                      const target = targets.find(t => t.month === i + 1);
                      return (
                        <TableRow key={month}>
                          <TableCell className="font-medium">{month}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-20"
                              value={target?.leadsGoal || 0}
                              onChange={(e) => handleUpdateTarget(i + 1, 'leadsGoal', parseInt(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-20"
                              value={target?.salesGoal || 0}
                              onChange={(e) => handleUpdateTarget(i + 1, 'salesGoal', parseInt(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-28"
                              value={target?.revenueGoal || 0}
                              onChange={(e) => handleUpdateTarget(i + 1, 'revenueGoal', parseInt(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-28"
                              value={target?.grossProfitGoal || 0}
                              onChange={(e) => handleUpdateTarget(i + 1, 'grossProfitGoal', parseInt(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-20"
                              value={target?.reviewsGoal || 0}
                              onChange={(e) => handleUpdateTarget(i + 1, 'reviewsGoal', parseInt(e.target.value) || 0)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

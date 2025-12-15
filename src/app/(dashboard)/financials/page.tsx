'use client';

import { mockMonthlyKPIs, mockJobs } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Line, ComposedChart, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number, compact = false) {
  if (compact && amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (compact && amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

const chartConfig = {
  revenue: { label: 'Revenue', color: '#3b82f6' },
  grossProfit: { label: 'Gross Profit', color: '#22c55e' },
  netProfit: { label: 'Net Profit', color: '#8b5cf6' },
};

// Operating expenses (mock data)
const operatingExpenses = [
  { category: 'Insurance', monthly: 1500 },
  { category: 'Vehicle', monthly: 2000 },
  { category: 'Software', monthly: 500 },
  { category: 'Marketing', monthly: 3000 },
  { category: 'Office/Admin', monthly: 1000 },
  { category: 'Misc', monthly: 500 },
];

const totalMonthlyOpex = operatingExpenses.reduce((sum, e) => sum + e.monthly, 0);

export default function FinancialsPage() {
  // Calculate YTD totals
  const ytdRevenue = mockMonthlyKPIs.reduce((sum, m) => sum + m.revenue, 0);
  const ytdGrossProfit = mockMonthlyKPIs.reduce((sum, m) => sum + m.grossProfit, 0);
  const ytdNetProfit = mockMonthlyKPIs.reduce((sum, m) => sum + m.netProfit, 0);
  const ytdGrossMargin = ytdRevenue > 0 ? (ytdGrossProfit / ytdRevenue) * 100 : 0;
  const ytdNetMargin = ytdRevenue > 0 ? (ytdNetProfit / ytdRevenue) * 100 : 0;

  // Target tracking
  const revenueTarget = 5000000;
  const revenueProgress = (ytdRevenue / revenueTarget) * 100;

  const chartData = mockMonthlyKPIs.map((m) => ({
    month: m.month,
    revenue: m.revenue / 1000,
    grossProfit: m.grossProfit / 1000,
    netProfit: m.netProfit / 1000,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
        <p className="text-slate-500">Track your revenue, profit, and expenses</p>
      </div>

      {/* YTD Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Revenue YTD</p>
                <p className="text-2xl font-bold">{formatCurrency(ytdRevenue, true)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Target className="h-3 w-3 text-slate-400" />
                  <span className="text-xs text-slate-500">
                    {revenueProgress.toFixed(0)}% of $5M target
                  </span>
                </div>
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
                <p className="text-sm text-slate-500">Gross Profit YTD</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(ytdGrossProfit, true)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-slate-500">
                    {ytdGrossMargin.toFixed(1)}% GM
                  </span>
                </div>
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
                <p className="text-sm text-slate-500">Net Profit YTD</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(ytdNetProfit, true)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-slate-500">
                    {ytdNetMargin.toFixed(1)}% Net Margin
                  </span>
                </div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Monthly OpEx</p>
                <p className="text-2xl font-bold text-slate-700">
                  {formatCurrency(totalMonthlyOpex)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatCurrency(totalMonthlyOpex * 12, true)}/year
                </p>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue & Profit</CardTitle>
          <CardDescription>Performance by month (in thousands)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}K`} />
              <ChartTooltip content={<ChartTooltipContent />} formatter={(value: number) => [`$${value.toFixed(0)}K`, '']} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
              <Line type="monotone" dataKey="grossProfit" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} name="Gross Profit" />
              <Line type="monotone" dataKey="netProfit" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} name="Net Profit" />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly P&L Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly P&L Statement (2024)</CardTitle>
          <CardDescription>Detailed profit and loss by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white">Metric</TableHead>
                  {mockMonthlyKPIs.map((m) => (
                    <TableHead key={m.month} className="text-right min-w-[80px]">
                      {m.month}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-bold bg-slate-50 min-w-[100px]">
                    YTD
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Revenue */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white">
                    Revenue
                  </TableCell>
                  {mockMonthlyKPIs.map((m) => (
                    <TableCell key={m.month} className="text-right">
                      {formatCurrency(m.revenue, true)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold bg-slate-50">
                    {formatCurrency(ytdRevenue, true)}
                  </TableCell>
                </TableRow>

                {/* Jobs */}
                <TableRow className="bg-slate-50/50">
                  <TableCell className="text-slate-500 sticky left-0 bg-slate-50/50">
                    Jobs Invoiced
                  </TableCell>
                  {mockMonthlyKPIs.map((m) => (
                    <TableCell key={m.month} className="text-right text-slate-500">
                      {m.jobsInvoiced}
                    </TableCell>
                  ))}
                  <TableCell className="text-right text-slate-500 bg-slate-100">
                    {mockMonthlyKPIs.reduce((sum, m) => sum + m.jobsInvoiced, 0)}
                  </TableCell>
                </TableRow>

                {/* Gross Profit */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white">
                    Gross Profit
                  </TableCell>
                  {mockMonthlyKPIs.map((m) => (
                    <TableCell key={m.month} className="text-right text-green-600">
                      {formatCurrency(m.grossProfit, true)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-green-600 bg-slate-50">
                    {formatCurrency(ytdGrossProfit, true)}
                  </TableCell>
                </TableRow>

                {/* GM % */}
                <TableRow className="bg-slate-50/50">
                  <TableCell className="text-slate-500 sticky left-0 bg-slate-50/50">
                    Gross Margin %
                  </TableCell>
                  {mockMonthlyKPIs.map((m) => (
                    <TableCell
                      key={m.month}
                      className={cn(
                        'text-right',
                        m.grossMarginPct >= 40 ? 'text-green-600' : 'text-amber-600'
                      )}
                    >
                      {m.grossMarginPct}%
                    </TableCell>
                  ))}
                  <TableCell
                    className={cn(
                      'text-right font-bold bg-slate-100',
                      ytdGrossMargin >= 40 ? 'text-green-600' : 'text-amber-600'
                    )}
                  >
                    {ytdGrossMargin.toFixed(1)}%
                  </TableCell>
                </TableRow>

                {/* Operating Expenses */}
                <TableRow>
                  <TableCell className="font-medium sticky left-0 bg-white">
                    Operating Expenses
                  </TableCell>
                  {mockMonthlyKPIs.map((m, i) => (
                    <TableCell key={m.month} className="text-right text-red-600">
                      ({formatCurrency(totalMonthlyOpex, true)})
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-red-600 bg-slate-50">
                    ({formatCurrency(totalMonthlyOpex * 12, true)})
                  </TableCell>
                </TableRow>

                {/* Net Profit */}
                <TableRow className="border-t-2">
                  <TableCell className="font-bold sticky left-0 bg-white">
                    Net Profit
                  </TableCell>
                  {mockMonthlyKPIs.map((m) => (
                    <TableCell
                      key={m.month}
                      className={cn(
                        'text-right font-medium',
                        m.netProfit > 0 ? 'text-purple-600' : 'text-red-600'
                      )}
                    >
                      {formatCurrency(m.netProfit, true)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-purple-600 bg-slate-50">
                    {formatCurrency(ytdNetProfit, true)}
                  </TableCell>
                </TableRow>

                {/* Net Margin % */}
                <TableRow className="bg-slate-50/50">
                  <TableCell className="text-slate-500 sticky left-0 bg-slate-50/50">
                    Net Margin %
                  </TableCell>
                  {mockMonthlyKPIs.map((m) => {
                    const netMargin = m.revenue > 0 ? (m.netProfit / m.revenue) * 100 : 0;
                    return (
                      <TableCell key={m.month} className="text-right text-slate-500">
                        {netMargin.toFixed(1)}%
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-bold text-slate-600 bg-slate-100">
                    {ytdNetMargin.toFixed(1)}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Operating Expenses Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Expenses</CardTitle>
          <CardDescription>Monthly fixed costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operatingExpenses.map((expense) => (
              <div
                key={expense.category}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <span className="font-medium text-slate-700">{expense.category}</span>
                <span className="font-bold">{formatCurrency(expense.monthly)}/mo</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-slate-900 rounded-lg text-white flex justify-between items-center">
            <span className="font-medium">Total Monthly Operating Expenses</span>
            <span className="text-2xl font-bold">{formatCurrency(totalMonthlyOpex)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import { mockMonthlyKPIs } from '@/lib/mock-data';

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: '#3b82f6',
  },
  grossProfit: {
    label: 'Gross Profit',
    color: '#22c55e',
  },
  netProfit: {
    label: 'Net Profit',
    color: '#8b5cf6',
  },
};

export function RevenueChart() {
  const data = mockMonthlyKPIs.map((item) => ({
    month: item.month,
    revenue: item.revenue / 1000,
    grossProfit: item.grossProfit / 1000,
    netProfit: item.netProfit / 1000,
  }));

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Revenue & Profit (2024)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}K`}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value: number) => [`$${value.toFixed(0)}K`, '']}
            />
            <Bar
              dataKey="revenue"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="grossProfit"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }}
              name="Gross Profit"
            />
            <Line
              type="monotone"
              dataKey="netProfit"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
              name="Net Profit"
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

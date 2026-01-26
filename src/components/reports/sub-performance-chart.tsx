'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import type { SubPerformanceEntry } from '@/types/reports';

interface SubPerformanceChartProps {
  /** Subcontractor performance data */
  data: SubPerformanceEntry[];
  /** Metric to display */
  metric?: 'revenue' | 'margin' | 'jobs';
  /** Chart title */
  title?: string;
  /** Chart height */
  height?: number;
  /** Max items to show */
  limit?: number;
}

const chartConfig: ChartConfig = {
  totalRevenue: {
    label: 'Receita',
    color: '#3b82f6',
  },
  avgProfitMargin: {
    label: 'Margem',
    color: '#22c55e',
  },
  completedJobs: {
    label: 'Jobs',
    color: '#a855f7',
  },
};

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}

export function SubPerformanceChart({
  data,
  metric = 'revenue',
  title = 'Performance de Subcontratados',
  height = 300,
  limit = 10,
}: SubPerformanceChartProps) {
  // Sort and limit data
  const sortedData = [...data]
    .sort((a, b) => {
      if (metric === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (metric === 'margin') return b.avgProfitMargin - a.avgProfitMargin;
      return b.completedJobs - a.completedJobs;
    })
    .slice(0, limit);

  // Prepare chart data
  const chartData = sortedData.map((d) => ({
    name: d.name.length > 15 ? d.name.slice(0, 15) + '...' : d.name,
    fullName: d.name,
    value: metric === 'revenue' ? d.totalRevenue : metric === 'margin' ? d.avgProfitMargin : d.completedJobs,
    totalRevenue: d.totalRevenue,
    avgProfitMargin: d.avgProfitMargin,
    completedJobs: d.completedJobs,
  }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-slate-400">
            Nenhum dado para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDataKey = () => {
    if (metric === 'revenue') return 'totalRevenue';
    if (metric === 'margin') return 'avgProfitMargin';
    return 'completedJobs';
  };

  const getFormatter = () => {
    if (metric === 'revenue') return formatCurrency;
    if (metric === 'margin') return formatPercent;
    return (v: number) => v.toString();
  };

  const getColor = () => {
    if (metric === 'revenue') return '#3b82f6';
    if (metric === 'margin') return '#22c55e';
    return '#a855f7';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className={`w-full h-[${height}px]`}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tickFormatter={getFormatter()}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === 'totalRevenue') return [formatCurrency(value as number), 'Receita'];
                    if (name === 'avgProfitMargin') return [formatPercent(value as number), 'Margem'];
                    return [value, 'Jobs'];
                  }}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item?.fullName || label;
                  }}
                />
              }
            />
            <Bar
              dataKey={getDataKey()}
              fill={getColor()}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

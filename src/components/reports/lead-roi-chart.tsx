'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { LeadSourceROI } from '@/types/reports';

interface LeadROIChartProps {
  /** Lead source ROI data */
  data: LeadSourceROI[];
  /** Metric to display */
  metric?: 'roi' | 'conversionRate' | 'revenue';
  /** Chart title */
  title?: string;
  /** Chart height */
  height?: number;
}

const chartConfig: ChartConfig = {
  value: {
    label: 'Valor',
    color: 'hsl(var(--chart-1))',
  },
  positive: {
    label: 'Positivo',
    color: '#22c55e',
  },
  negative: {
    label: 'Negativo',
    color: '#ef4444',
  },
};

function formatValue(value: number, metric: string): string {
  if (metric === 'revenue') {
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }
  return `${value.toFixed(1)}%`;
}

export function LeadROIChart({
  data,
  metric = 'roi',
  title = 'ROI por Fonte de Lead',
  height = 300,
}: LeadROIChartProps) {
  // Prepare chart data
  const chartData = data.map((d) => ({
    source: d.label,
    value: metric === 'roi' ? d.roi : metric === 'conversionRate' ? d.conversionRate : d.totalRevenue,
    fill: metric !== 'revenue' 
      ? (metric === 'roi' ? d.roi : d.conversionRate) >= 0 
        ? '#22c55e' 
        : '#ef4444'
      : '#3b82f6',
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
            margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => formatValue(v, metric)}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="source"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            {metric !== 'revenue' && (
              <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
            )}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [
                    formatValue(value as number, metric),
                    metric === 'roi' ? 'ROI' : metric === 'conversionRate' ? 'Conversão' : 'Receita',
                  ]}
                />
              }
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              fill="#3b82f6"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

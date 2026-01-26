'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import type { RevenueBreakdown } from '@/types/reports';

interface RevenueTypeChartProps {
  /** Revenue breakdown by project type */
  data: RevenueBreakdown;
  /** Chart title */
  title?: string;
  /** Chart height */
  height?: number;
}

const COLORS = {
  interior: '#3b82f6', // blue-500
  exterior: '#22c55e', // green-500
  both: '#a855f7',     // purple-500
};

const LABELS = {
  interior: 'Interior',
  exterior: 'Exterior',
  both: 'Ambos',
};

const chartConfig: ChartConfig = {
  interior: {
    label: 'Interior',
    color: COLORS.interior,
  },
  exterior: {
    label: 'Exterior',
    color: COLORS.exterior,
  },
  both: {
    label: 'Ambos',
    color: COLORS.both,
  },
};

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function RevenueTypeChart({
  data,
  title = 'Receita por Tipo de Projeto',
  height = 300,
}: RevenueTypeChartProps) {
  // Convert to chart data format
  const chartData = [
    { name: 'interior', value: data.interior, label: LABELS.interior, color: COLORS.interior },
    { name: 'exterior', value: data.exterior, label: LABELS.exterior, color: COLORS.exterior },
    { name: 'both', value: data.both, label: LABELS.both, color: COLORS.both },
  ].filter((d) => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
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
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="label"
              label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [formatCurrency(value as number), 'Receita']}
                />
              }
            />
          </PieChart>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-slate-600">
                {entry.label}: {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

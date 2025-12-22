'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  current: number;
  goal: number;
  format?: 'number' | 'currency' | 'percent';
  icon: LucideIcon;
  subtitle?: string;
}

function formatValue(value: number, format: 'number' | 'currency' | 'percent' = 'number'): string {
  if (format === 'currency') {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString('en-US')}`;
  }
  if (format === 'percent') {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString('en-US');
}

export function ProgressCard({
  title,
  current,
  goal,
  format = 'number',
  icon: Icon,
  subtitle,
}: ProgressCardProps) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  // Determine status color
  let status: 'success' | 'warning' | 'danger' = 'danger';
  if (percentage >= 80) {
    status = 'success';
  } else if (percentage >= 50) {
    status = 'warning';
  }

  const statusColors = {
    success: {
      bg: 'bg-green-500',
      text: 'text-green-600',
      light: 'bg-green-50',
      label: 'No caminho!',
    },
    warning: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600',
      light: 'bg-yellow-50',
      label: 'Atenção',
    },
    danger: {
      bg: 'bg-red-500',
      text: 'text-red-600',
      light: 'bg-red-50',
      label: 'Atrasado',
    },
  };

  const colors = statusColors[status];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', colors.light)}>
              <Icon className={cn('w-5 h-5', colors.text)} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              {subtitle && (
                <p className="text-xs text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full', colors.light, colors.text)}>
            {colors.label}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-slate-900">
              {formatValue(current, format)}
            </span>
            <span className="text-sm text-slate-500">
              de {formatValue(goal, format)}
            </span>
          </div>

          <div className="space-y-1">
            <Progress
              value={percentage}
              className="h-3"
              indicatorClassName={colors.bg}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{percentage.toFixed(0)}% da meta</span>
              <span>Faltam {formatValue(Math.max(goal - current, 0), format)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

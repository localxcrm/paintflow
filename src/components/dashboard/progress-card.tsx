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
    <Card variant="glass" className="overflow-hidden border-white/20 hover:translate-y-[-2px] transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl shadow-inner', colors.light)}>
              <Icon className={cn('w-6 h-6', colors.text)} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
              {subtitle && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <span className={cn('text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border flex items-center gap-1.5', colors.text === 'text-green-600' ? 'bg-green-50/50 border-green-100' : colors.text === 'text-yellow-600' ? 'bg-yellow-50/50 border-yellow-100' : 'bg-red-50/50 border-red-100')}>
            <div className={cn("w-1.5 h-1.5 rounded-full", colors.bg)} />
            {colors.label}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">
              {formatValue(current, format)}
            </span>
            <span className="text-xs font-bold text-slate-400">
              Objetivo: <span className="text-slate-600">{formatValue(goal, format)}</span>
            </span>
          </div>

          <div className="space-y-2">
            <div className="relative h-2.5 w-full bg-slate-100/50 rounded-full overflow-hidden shadow-inner">
              <div
                className={cn("absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full shadow-sm", colors.bg)}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-slate-500 uppercase tracking-tighter">{percentage.toFixed(0)}% concluído</span>
              <span className="text-brand-teal">{formatValue(Math.max(goal - current, 0), format)} restantes</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

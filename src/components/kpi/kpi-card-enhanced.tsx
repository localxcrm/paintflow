'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sparkline } from './sparkline';
import { KPIMetric } from '@/types/kpi';

interface KPICardEnhancedProps {
  /** Card title */
  title: string;
  /** KPI metric data with current, previous, delta, and trend */
  metric: KPIMetric;
  /** Value format type */
  format?: 'currency' | 'number' | 'percent';
  /** Icon to display */
  icon: LucideIcon;
  /** Visual variant for icon background */
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /** Custom sparkline color (defaults to trend-based color) */
  sparklineColor?: string;
  /** Optional click handler for drill-down navigation */
  onClick?: () => void;
}

/**
 * Format a numeric value based on the specified format type.
 * Handles currency with K/M shorthand, percentages, and plain numbers.
 */
function formatValue(value: number, format: 'currency' | 'number' | 'percent'): string {
  switch (format) {
    case 'currency':
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return value.toLocaleString('en-US');
  }
}

/**
 * Enhanced KPI card with delta indicator and sparkline trend visualization.
 * Builds on existing kpi-card.tsx pattern with additional features.
 */
export function KPICardEnhanced({
  title,
  metric,
  format = 'number',
  icon: Icon,
  variant = 'default',
  sparklineColor,
  onClick,
}: KPICardEnhancedProps) {
  const variantStyles = {
    default: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
  };

  const deltaColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    flat: 'text-slate-400',
  };

  const DeltaIcon =
    metric.deltaDirection === 'up'
      ? TrendingUp
      : metric.deltaDirection === 'down'
        ? TrendingDown
        : Minus;

  // Determine sparkline color based on trend or custom color
  const chartColor =
    sparklineColor ||
    (metric.deltaDirection === 'up'
      ? '#22c55e' // green-500
      : metric.deltaDirection === 'down'
        ? '#ef4444' // red-500
        : '#94a3b8'); // slate-400

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatValue(metric.current, format)}
            </p>

            {/* Delta indicator */}
            <div className="flex items-center gap-1">
              <DeltaIcon className={cn('h-4 w-4', deltaColors[metric.deltaDirection])} />
              <span className={cn('text-sm font-medium', deltaColors[metric.deltaDirection])}>
                {metric.delta > 0 ? '+' : ''}
                {metric.delta.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">vs anterior</span>
            </div>
          </div>

          {/* Right side: icon and sparkline */}
          <div className="flex flex-col items-end gap-2">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                variantStyles[variant]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Sparkline */}
            {metric.trend && metric.trend.length > 0 && (
              <Sparkline data={metric.trend} color={chartColor} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

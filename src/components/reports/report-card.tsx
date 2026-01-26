'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReportCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description?: string;
  /** Icon to display */
  icon?: LucideIcon;
  /** Current value (formatted string) */
  value: string;
  /** Previous period value for comparison */
  previousValue?: string;
  /** Percentage change */
  percentChange?: number;
  /** Direction of change */
  changeDirection?: 'up' | 'down' | 'flat';
  /** Whether increase is good (default true) */
  increaseIsGood?: boolean;
  /** Additional content below the value */
  children?: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Reusable report card component for displaying metrics with comparison
 */
export function ReportCard({
  title,
  description,
  icon: Icon,
  value,
  previousValue,
  percentChange,
  changeDirection = 'flat',
  increaseIsGood = true,
  children,
  className,
  onClick,
}: ReportCardProps) {
  const DeltaIcon = changeDirection === 'up' 
    ? TrendingUp 
    : changeDirection === 'down' 
      ? TrendingDown 
      : Minus;

  // Determine color based on direction and whether increase is good
  const isPositive = (changeDirection === 'up' && increaseIsGood) || 
                     (changeDirection === 'down' && !increaseIsGood);
  const isNegative = (changeDirection === 'down' && increaseIsGood) || 
                     (changeDirection === 'up' && !increaseIsGood);

  const changeColorClass = isPositive 
    ? 'text-green-600' 
    : isNegative 
      ? 'text-red-600' 
      : 'text-slate-400';

  return (
    <Card 
      className={cn(
        'transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-slate-500">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs text-slate-400">
              {description}
            </CardDescription>
          )}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Icon className="h-5 w-5 text-slate-600" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        
        {(percentChange !== undefined || previousValue) && (
          <div className="mt-1 flex items-center gap-2 text-sm">
            {percentChange !== undefined && (
              <div className={cn('flex items-center gap-1', changeColorClass)}>
                <DeltaIcon className="h-4 w-4" />
                <span className="font-medium">
                  {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                </span>
              </div>
            )}
            {previousValue && (
              <span className="text-slate-400">
                vs {previousValue}
              </span>
            )}
          </div>
        )}
        
        {children}
      </CardContent>
    </Card>
  );
}

interface ReportSectionProps {
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Section icon */
  icon?: LucideIcon;
  /** Section content */
  children: React.ReactNode;
  /** Actions (buttons, etc.) */
  actions?: React.ReactNode;
  /** Custom class name */
  className?: string;
}

/**
 * Section wrapper for report content
 */
export function ReportSection({
  title,
  description,
  icon: Icon,
  children,
  actions,
  className,
}: ReportSectionProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
          )}
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

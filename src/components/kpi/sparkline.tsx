'use client';

import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TrendDataPoint } from '@/types/kpi';

interface SparklineProps {
  /** Trend data points array */
  data: TrendDataPoint[];
  /** Line and fill color (hex format) */
  color?: string;
  /** Chart height in pixels */
  height?: number;
  /** Chart width in pixels */
  width?: number;
}

/**
 * Tiny inline sparkline chart for KPI trend visualization.
 * No axes, grid, or labels - just the trend line with gradient fill.
 */
export function Sparkline({
  data,
  color = '#3b82f6', // blue-500 default
  height = 32,
  width = 80,
}: SparklineProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return <div className="h-8 w-20" aria-label="No trend data available" />;
  }

  // Create unique gradient ID based on color
  const gradientId = `sparkline-gradient-${color.replace('#', '')}`;

  return (
    <div style={{ width, height }} aria-label="Trend sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

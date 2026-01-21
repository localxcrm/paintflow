'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LeadSourceData } from '@/types/kpi';

interface LeadSourcePieProps {
  data: LeadSourceData[];
  onClick?: (source: string) => void;
}

// Source colors matching MarketingChannel enum
const SOURCE_COLORS: Record<string, string> = {
  google: '#4285F4',      // Google blue
  facebook: '#1877F2',    // Facebook blue
  referral: '#10b981',    // green-500
  yard_sign: '#f59e0b',   // amber-500
  door_knock: '#8b5cf6',  // violet-500
  repeat: '#06b6d4',      // cyan-500
  site: '#ec4899',        // pink-500
  other: '#94a3b8',       // slate-400
};

// Portuguese labels
const SOURCE_LABELS: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  referral: 'Indicacao',
  yard_sign: 'Placa',
  door_knock: 'Porta a Porta',
  repeat: 'Cliente Recorrente',
  site: 'Site',
  other: 'Outro',
};

export function LeadSourcePie({ data, onClick }: LeadSourcePieProps) {
  // Prepare data with colors and labels
  const chartData = data.map(d => ({
    ...d,
    label: SOURCE_LABELS[d.source] || d.label || d.source,
    fill: SOURCE_COLORS[d.source] || '#94a3b8',
  }));

  // Sort by count descending for better visual
  chartData.sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Origem dos Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
                onClick={(_, index) => onClick?.(chartData[index].source)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    cursor={onClick ? 'pointer' : 'default'}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border rounded-lg shadow-lg p-3">
                      <p className="font-medium">{d.label}</p>
                      <p className="text-sm text-slate-600">
                        {d.count} leads ({d.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend below chart */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {chartData.map((item) => (
            <div
              key={item.source}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80"
              onClick={() => onClick?.(item.source)}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs text-slate-600">
                {item.label} ({item.count})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

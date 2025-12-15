'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { mockLeads } from '@/lib/mock-data';

const statusColors: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#8b5cf6',
  estimate_scheduled: '#f59e0b',
  estimated: '#22c55e',
  proposal_sent: '#06b6d4',
  follow_up: '#ec4899',
  won: '#10b981',
  lost: '#ef4444',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  estimate_scheduled: 'Estimate Scheduled',
  estimated: 'Estimated',
  proposal_sent: 'Proposal Sent',
  follow_up: 'Follow Up',
  won: 'Won',
  lost: 'Lost',
};

export function PipelineChart() {
  // Count leads by status
  const statusCounts = mockLeads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabels[status] || status,
    value: count,
    color: statusColors[status] || '#94a3b8',
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Pipeline Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border rounded-lg shadow-lg p-3">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-slate-500">{data.value} leads</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-600">
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

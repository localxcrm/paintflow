'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelChart, Funnel, Cell, ResponsiveContainer, LabelList, Tooltip } from 'recharts';
import { LeadPipelineData } from '@/types/kpi';

interface LeadPipelineFunnelProps {
  data: LeadPipelineData[];
  onClick?: (stage: string) => void;
}

// Stage colors - gradient from blue (top) to green (won)
const STAGE_COLORS: Record<string, string> = {
  new: '#3b82f6',           // blue-500
  contacted: '#6366f1',      // indigo-500
  estimate_scheduled: '#8b5cf6', // violet-500
  estimated: '#a855f7',      // purple-500
  proposal_sent: '#d946ef',  // fuchsia-500
  follow_up: '#f59e0b',      // amber-500
  won: '#22c55e',            // green-500
  lost: '#ef4444',           // red-500 (excluded from funnel)
};

// Portuguese labels
const STAGE_LABELS: Record<string, string> = {
  new: 'Novos',
  contacted: 'Contatados',
  estimate_scheduled: 'Orcamento Agendado',
  estimated: 'Orcado',
  proposal_sent: 'Proposta Enviada',
  follow_up: 'Acompanhamento',
  won: 'Ganhos',
};

export function LeadPipelineFunnel({ data, onClick }: LeadPipelineFunnelProps) {
  // Filter out lost leads (not part of funnel) and sort by funnel order
  const funnelOrder = ['new', 'contacted', 'estimate_scheduled', 'estimated', 'proposal_sent', 'follow_up', 'won'];

  const funnelData = data
    .filter(d => d.stage !== 'lost')
    .sort((a, b) => funnelOrder.indexOf(a.stage) - funnelOrder.indexOf(b.stage))
    .map(d => ({
      ...d,
      label: STAGE_LABELS[d.stage] || d.label,
      fill: STAGE_COLORS[d.stage] || '#94a3b8',
    }));

  // Calculate total for percentage display
  const totalLeads = funnelData.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Pipeline de Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  const pct = totalLeads > 0 ? ((d.count / totalLeads) * 100).toFixed(1) : '0';
                  return (
                    <div className="bg-white border rounded-lg shadow-lg p-3">
                      <p className="font-medium">{d.label}</p>
                      <p className="text-sm text-slate-600">{d.count} leads ({pct}%)</p>
                      {d.value > 0 && (
                        <p className="text-sm text-slate-500">
                          Valor: ${d.value.toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Funnel
                dataKey="count"
                data={funnelData}
                isAnimationActive={true}
                onClick={(data) => onClick?.(data.stage)}
              >
                <LabelList
                  position="right"
                  fill="#374151"
                  stroke="none"
                  dataKey="label"
                  className="text-xs"
                />
                {funnelData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    cursor={onClick ? 'pointer' : 'default'}
                  />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* Legend below chart */}
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {funnelData.map((item) => (
            <div key={item.stage} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs text-slate-600">
                {item.label}: {item.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

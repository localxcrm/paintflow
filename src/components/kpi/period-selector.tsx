'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPIPeriod } from '@/types/kpi';

interface PeriodSelectorProps {
  /** Currently selected period */
  value: KPIPeriod;
  /** Callback when period changes */
  onChange: (period: KPIPeriod) => void;
}

/** Period options with Portuguese labels */
const PERIODS: { value: KPIPeriod; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Ano' },
];

/**
 * Period selection tabs for KPI dashboard.
 * Uses shadcn/ui Tabs with Portuguese labels.
 * Controlled component - parent manages state.
 */
export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as KPIPeriod)}>
      <TabsList>
        {PERIODS.map((period) => (
          <TabsTrigger key={period.value} value={period.value}>
            {period.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

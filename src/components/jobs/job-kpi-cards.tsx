'use client';

import { Card, CardContent } from '@/components/ui/card';
import { JobKPIs } from '@/types';
import { formatCurrency } from '@/lib/utils/job-calculations';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Briefcase,
} from 'lucide-react';

interface JobKPICardsProps {
  kpis: JobKPIs;
}

export function JobKPICards({ kpis }: JobKPICardsProps) {
  const cards = [
    {
      title: 'Total Job Value',
      value: formatCurrency(kpis.totalJobValue),
      subtitle: `${kpis.jobCount} jobs`,
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Avg Job Value',
      value: formatCurrency(kpis.averageJobValue),
      subtitle: 'Per job',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Sales Comm. Pending',
      value: formatCurrency(kpis.salesCommissionsPending),
      subtitle: 'To be paid',
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      title: 'Sales Comm. Paid',
      value: formatCurrency(kpis.salesCommissionsPaid),
      subtitle: 'Completed',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'PM Comm. Pending',
      value: formatCurrency(kpis.pmCommissionsPending),
      subtitle: 'To be paid',
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'PM Comm. Paid',
      value: formatCurrency(kpis.pmCommissionsPaid),
      subtitle: 'Completed',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Sub Pending',
      value: formatCurrency(kpis.subcontractorPending),
      subtitle: 'To be paid',
      icon: Users,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Sub Paid',
      value: formatCurrency(kpis.subcontractorPaid),
      subtitle: 'Completed',
      icon: Briefcase,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">{card.title}</p>
                <p className="text-xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-400">{card.subtitle}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

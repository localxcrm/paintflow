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
      title: 'Valor Total',
      value: formatCurrency(kpis.totalJobValue),
      subtitle: `${kpis.jobCount} trabalhos`,
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Valor Médio',
      value: formatCurrency(kpis.averageJobValue),
      subtitle: 'Por trabalho',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Com. Vendas Pendente',
      value: formatCurrency(kpis.salesCommissionsPending),
      subtitle: 'A pagar',
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      title: 'Com. Vendas Pago',
      value: formatCurrency(kpis.salesCommissionsPaid),
      subtitle: 'Concluído',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Com. PM Pendente',
      value: formatCurrency(kpis.pmCommissionsPending),
      subtitle: 'A pagar',
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'Com. PM Pago',
      value: formatCurrency(kpis.pmCommissionsPaid),
      subtitle: 'Concluído',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Sub Pendente',
      value: formatCurrency(kpis.subcontractorPending),
      subtitle: 'A pagar',
      icon: Users,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Sub Pago',
      value: formatCurrency(kpis.subcontractorPaid),
      subtitle: 'Concluído',
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

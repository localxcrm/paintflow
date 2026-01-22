'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PaymentStatusBadgeProps {
  status: 'paid' | 'pending' | 'partial';
  amount?: number;
}

export function PaymentStatusBadge({ status, amount }: PaymentStatusBadgeProps) {
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const statusConfig = {
    paid: {
      label: 'Pago',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    pending: {
      label: 'Pendente',
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    partial: {
      label: 'Parcial',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  };

  const config = statusConfig[status];
  const displayText = amount !== undefined && amount > 0
    ? `${config.label} - ${formatCurrency(amount)}`
    : config.label;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        config.className
      )}
    >
      {displayText}
    </Badge>
  );
}

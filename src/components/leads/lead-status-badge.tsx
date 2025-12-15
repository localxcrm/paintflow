'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LeadStatus } from '@/types';

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  contacted: { label: 'Contacted', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  estimate_scheduled: { label: 'Estimate Scheduled', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  estimated: { label: 'Estimated', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  proposal_sent: { label: 'Proposal Sent', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  follow_up: { label: 'Follow Up', className: 'bg-pink-100 text-pink-700 border-pink-200' },
  won: { label: 'Won', className: 'bg-green-100 text-green-700 border-green-200' },
  lost: { label: 'Lost', className: 'bg-red-100 text-red-700 border-red-200' },
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn('font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

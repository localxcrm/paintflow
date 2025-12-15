'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TeamMember, Subcontractor, JobStatus, PaymentStatus } from '@/types';
import { X } from 'lucide-react';

interface JobFiltersProps {
  statusFilter: JobStatus | 'all';
  paymentFilter: PaymentStatus;
  salesRepFilter: string;
  pmFilter: string;
  subcontractorFilter: string;
  teamMembers: TeamMember[];
  subcontractors: Subcontractor[];
  onStatusChange: (value: JobStatus | 'all') => void;
  onPaymentChange: (value: PaymentStatus) => void;
  onSalesRepChange: (value: string) => void;
  onPMChange: (value: string) => void;
  onSubcontractorChange: (value: string) => void;
  onClearFilters: () => void;
}

export function JobFilters({
  statusFilter,
  paymentFilter,
  salesRepFilter,
  pmFilter,
  subcontractorFilter,
  teamMembers,
  subcontractors,
  onStatusChange,
  onPaymentChange,
  onSalesRepChange,
  onPMChange,
  onSubcontractorChange,
  onClearFilters,
}: JobFiltersProps) {
  const salesReps = teamMembers.filter(m => m.role === 'sales' || m.role === 'both');
  const pms = teamMembers.filter(m => m.role === 'pm' || m.role === 'both');

  const hasActiveFilters =
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    salesRepFilter !== 'all' ||
    pmFilter !== 'all' ||
    subcontractorFilter !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-600">Filters:</span>
      </div>

      <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as JobStatus | 'all')}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="lead">Lead</SelectItem>
          <SelectItem value="got_the_job">Got the Job</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={paymentFilter} onValueChange={(v) => onPaymentChange(v as PaymentStatus)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Payment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Payments</SelectItem>
          <SelectItem value="deposit_pending">Deposit Pending</SelectItem>
          <SelectItem value="job_unpaid">Job Unpaid</SelectItem>
          <SelectItem value="fully_paid">Fully Paid</SelectItem>
        </SelectContent>
      </Select>

      <Select value={salesRepFilter} onValueChange={onSalesRepChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sales Rep" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sales Reps</SelectItem>
          {salesReps.map((rep) => (
            <SelectItem key={rep.id} value={rep.id}>
              {rep.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={pmFilter} onValueChange={onPMChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="PM" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All PMs</SelectItem>
          {pms.map((pm) => (
            <SelectItem key={pm.id} value={pm.id}>
              {pm.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={subcontractorFilter} onValueChange={onSubcontractorChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Subcontractor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Subs</SelectItem>
          {subcontractors.map((sub) => (
            <SelectItem key={sub.id} value={sub.id}>
              {sub.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-1 text-slate-500 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

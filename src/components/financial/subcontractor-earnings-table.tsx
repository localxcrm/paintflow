'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { PaymentStatusBadge } from './payment-status-badge';

// Type definitions (matching 03-01-PLAN.md spec)
export interface SubcontractorFinancialSummary {
  id: string;
  name: string;
  companyName: string | null;
  email: string;
  defaultPayoutPct: number;
  isActive: boolean;
  totalEarnings: number;
  totalPaid: number;
  pendingAmount: number;
  jobsCompleted: number;
}

interface SubcontractorEarningsTableProps {
  data: SubcontractorFinancialSummary[];
  isLoading?: boolean;
}

type SortField = 'name' | 'jobsCompleted' | 'totalEarnings' | 'pendingAmount';
type SortDirection = 'asc' | 'desc';

export function SubcontractorEarningsTable({ data, isLoading }: SubcontractorEarningsTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Toggle sort direction or change field
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'jobsCompleted':
        aValue = a.jobsCompleted;
        bValue = b.jobsCompleted;
        break;
      case 'totalEarnings':
        aValue = a.totalEarnings;
        bValue = b.totalEarnings;
        break;
      case 'pendingAmount':
        aValue = a.pendingAmount;
        bValue = b.pendingAmount;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-slate-400" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        Nenhum subempreiteiro encontrado
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <button
                onClick={() => handleSort('name')}
                className="flex items-center font-semibold hover:text-slate-900 transition-colors"
              >
                Subempreiteiro
                <SortIcon field="name" />
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                onClick={() => handleSort('jobsCompleted')}
                className="flex items-center justify-end font-semibold hover:text-slate-900 transition-colors ml-auto"
              >
                Jobs
                <SortIcon field="jobsCompleted" />
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button
                onClick={() => handleSort('totalEarnings')}
                className="flex items-center justify-end font-semibold hover:text-slate-900 transition-colors ml-auto"
              >
                Total Ganho
                <SortIcon field="totalEarnings" />
              </button>
            </TableHead>
            <TableHead className="text-right">Pago</TableHead>
            <TableHead className="text-right">
              <button
                onClick={() => handleSort('pendingAmount')}
                className="flex items-center justify-end font-semibold hover:text-slate-900 transition-colors ml-auto"
              >
                Pendente
                <SortIcon field="pendingAmount" />
              </button>
            </TableHead>
            <TableHead className="text-center">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((sub) => {
            const isPending = sub.pendingAmount > 0;
            const isPaid = sub.pendingAmount === 0 && sub.totalEarnings > 0;
            const status = isPending ? 'pending' : isPaid ? 'paid' : 'pending';

            return (
              <TableRow key={sub.id} className="hover:bg-slate-50">
                <TableCell>
                  <div>
                    <div className="font-medium text-slate-900">{sub.name}</div>
                    {sub.companyName && (
                      <div className="text-sm text-slate-500">{sub.companyName}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{sub.jobsCompleted}</TableCell>
                <TableCell className="text-right font-medium text-green-600">
                  {formatCurrency(sub.totalEarnings)}
                </TableCell>
                <TableCell className="text-right font-medium text-green-600">
                  {formatCurrency(sub.totalPaid)}
                </TableCell>
                <TableCell className="text-right">
                  <PaymentStatusBadge status={status} amount={sub.pendingAmount} />
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/financeiro/${sub.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

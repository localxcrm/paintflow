'use client';

import { useState } from 'react';
import { mockEstimates } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Send,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { EstimateStatus } from '@/types';
import { format, parseISO } from 'date-fns';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

const statusConfig: Record<EstimateStatus, { label: string; className: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700', icon: <FileText className="h-3 w-3" /> },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-700', icon: <Send className="h-3 w-3" /> },
  viewed: { label: 'Viewed', className: 'bg-purple-100 text-purple-700', icon: <Eye className="h-3 w-3" /> },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
  declined: { label: 'Declined', className: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
  expired: { label: 'Expired', className: 'bg-amber-100 text-amber-700', icon: <Clock className="h-3 w-3" /> },
};

export default function EstimatesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const totalEstimates = mockEstimates.length;
  const draftCount = mockEstimates.filter((e) => e.status === 'draft').length;
  const sentCount = mockEstimates.filter((e) => e.status === 'sent').length;
  const totalValue = mockEstimates.reduce((sum, e) => sum + e.totalPrice, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estimates</h1>
          <p className="text-slate-500">Create and manage customer estimates</p>
        </div>
        <Link href="/estimates/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Estimate
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Estimates</p>
            <p className="text-2xl font-bold">{totalEstimates}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Draft</p>
            <p className="text-2xl font-bold text-slate-600">{draftCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Sent & Pending</p>
            <p className="text-2xl font-bold text-blue-600">{sentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Value</p>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search estimates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Estimates Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estimate #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Gross Profit</TableHead>
              <TableHead>GM %</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Guardrails</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockEstimates.map((estimate) => (
              <TableRow key={estimate.id}>
                <TableCell>
                  <p className="font-medium">{estimate.estimateNumber}</p>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{estimate.clientName}</p>
                    <p className="text-sm text-slate-500 truncate max-w-[200px]">
                      {estimate.address}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{format(parseISO(estimate.estimateDate), 'MMM d, yyyy')}</p>
                    <p className="text-slate-500">
                      Valid until {format(parseISO(estimate.validUntil), 'MMM d')}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{formatCurrency(estimate.totalPrice)}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-green-600">
                    {formatCurrency(estimate.grossProfit)}
                  </p>
                </TableCell>
                <TableCell>
                  <p className={cn(
                    'font-medium',
                    estimate.grossMarginPct >= 40 ? 'text-green-600' : 'text-amber-600'
                  )}>
                    {estimate.grossMarginPct}%
                  </p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn('font-medium gap-1', statusConfig[estimate.status].className)}
                  >
                    {statusConfig[estimate.status].icon}
                    {statusConfig[estimate.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        estimate.meetsMinGp
                          ? 'border-green-200 text-green-700'
                          : 'border-red-200 text-red-700'
                      )}
                    >
                      Min GP {estimate.meetsMinGp ? '✓' : '✗'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        estimate.meetsTargetGm
                          ? 'border-green-200 text-green-700'
                          : 'border-red-200 text-red-700'
                      )}
                    >
                      GM% {estimate.meetsTargetGm ? '✓' : '✗'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Send className="mr-2 h-4 w-4" /> Send to Client
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" /> Download PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

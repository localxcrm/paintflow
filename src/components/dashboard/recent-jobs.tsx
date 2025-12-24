'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockJobs } from '@/lib/mock-data';
import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { JobStatus, ProfitFlag } from '@/types';

const statusStyles: Record<JobStatus, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-slate-100 text-slate-700' },
  got_the_job: { label: 'Got the Job', className: 'bg-amber-100 text-amber-700' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
};

const profitFlagStyles: Record<ProfitFlag, string> = {
  'OK': 'bg-green-100 text-green-700',
  'RAISE PRICE': 'bg-red-100 text-red-700',
  'FIX SCOPE': 'bg-amber-100 text-amber-700',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RecentJobs() {
  const recentJobs = mockJobs.slice(0, 5);

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Jobs</CardTitle>
        <Link href="/jobs">
          <Button variant="ghost" size="sm" className="gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-sm text-slate-500">Job</th>
                <th className="pb-3 font-medium text-sm text-slate-500 hidden sm:table-cell">Location</th>
                <th className="pb-3 font-medium text-sm text-slate-500">Amount</th>
                <th className="pb-3 font-medium text-sm text-slate-500 hidden md:table-cell">Profit</th>
                <th className="pb-3 font-medium text-sm text-slate-500">Status</th>
                <th className="pb-3 font-medium text-sm text-slate-500 hidden lg:table-cell">Flag</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.map((job) => (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="py-4">
                    <div>
                      <p className="font-medium text-slate-900">{job.clientName}</p>
                      <p className="text-sm text-slate-500">{job.jobNumber}</p>
                    </div>
                  </td>
                  <td className="py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      {job.city}
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="font-medium">{formatCurrency(job.invoiceAmount || job.jobValue)}</p>
                  </td>
                  <td className="py-4 hidden md:table-cell">
                    <div>
                      <p className="font-medium text-green-600">
                        {formatCurrency(job.grossProfit)}
                      </p>
                      <p className="text-sm text-slate-500">{job.grossMarginPct}% GM</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge
                      variant="secondary"
                      className={cn('font-medium', statusStyles[job.status].className)}
                    >
                      {statusStyles[job.status].label}
                    </Badge>
                  </td>
                  <td className="py-4 hidden lg:table-cell">
                    <Badge
                      variant="secondary"
                      className={cn('font-medium', profitFlagStyles[job.profitFlag])}
                    >
                      {job.profitFlag}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

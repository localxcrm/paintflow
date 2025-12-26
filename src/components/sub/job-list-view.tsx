'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, DollarSign } from 'lucide-react';

interface WorkOrder {
  id: string;
  osNumber: string;
  status: string;
  publicToken: string;
}

interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  address: string;
  city: string;
  status: string;
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  subcontractorPrice: number;
  workOrder: WorkOrder | null;
  progress: number;
}

interface JobListViewProps {
  jobs: Job[];
}

export function JobListView({ jobs }: JobListViewProps) {
  const router = useRouter();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'HOJE';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'AMANHA';
    } else {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }).toUpperCase();
    }
  };

  const getStatusColor = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'bg-emerald-500';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'bg-amber-500';
    } else {
      return 'bg-slate-400';
    }
  };

  // Group jobs by date
  const groupedJobs = jobs.reduce((groups: Record<string, Job[]>, job) => {
    if (!job.scheduledStartDate) return groups;
    const dateKey = new Date(job.scheduledStartDate).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(job);
    return groups;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedJobs).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-slate-500 text-lg">Nenhum trabalho agendado</p>
          <p className="text-slate-400 text-sm mt-1">
            Seus trabalhos aparecerão aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map(dateKey => {
        const dateJobs = groupedJobs[dateKey];
        const firstJob = dateJobs[0];
        const dateLabel = firstJob.scheduledStartDate ? formatDate(firstJob.scheduledStartDate) : '';
        const statusColor = firstJob.scheduledStartDate ? getStatusColor(firstJob.scheduledStartDate) : 'bg-slate-400';

        return (
          <div key={dateKey} className="space-y-2">
            {/* Date Header */}
            <div className="flex items-center gap-2 px-1">
              <div className={`w-3 h-3 rounded-full ${statusColor}`} />
              <span className="font-bold text-sm text-slate-700">{dateLabel}</span>
            </div>

            {/* Jobs for this date */}
            {dateJobs.map(job => (
              <Card
                key={job.id}
                className="cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => {
                  if (job.workOrder) {
                    router.push(`/sub/os/${job.workOrder.id}`);
                  }
                }}
              >
                <CardContent className="p-4">
                  {/* Address */}
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {job.address}
                      </p>
                      <p className="text-sm text-slate-500">
                        {job.city} • {job.clientName}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {job.workOrder?.osNumber || job.jobNumber}
                    </Badge>
                  </div>

                  {/* Progress and Price */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3 flex-1">
                      <Progress value={job.progress} className="h-2.5 flex-1 max-w-[120px]" />
                      <span className="text-sm font-medium text-slate-600">
                        {job.progress}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(job.subcontractorPrice || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}

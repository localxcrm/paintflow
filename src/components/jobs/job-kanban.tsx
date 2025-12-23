'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Job } from '@/types';
import { DollarSign, MapPin, Calendar, User } from 'lucide-react';

interface JobKanbanProps {
  jobs: Job[];
  onJobClick: (job: Job) => void;
}

const COLUMNS = [
  { key: 'got_the_job', title: 'Confirmed', color: 'bg-green-500', borderColor: 'border-green-500' },
  { key: 'scheduled', title: 'Scheduled', color: 'bg-blue-500', borderColor: 'border-blue-500' },
  { key: 'completed', title: 'Completed', color: 'bg-emerald-500', borderColor: 'border-emerald-500' },
];

export function JobKanban({ jobs, onJobClick }: JobKanbanProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const jobsByStatus = useMemo(() => {
    const grouped: Record<string, Job[]> = {
      got_the_job: [],
      scheduled: [],
      completed: [],
    };

    jobs.forEach(job => {
      if (grouped[job.status]) {
        grouped[job.status].push(job);
      }
    });

    return grouped;
  }, [jobs]);

  const getColumnTotal = (status: string) => {
    return jobsByStatus[status]?.reduce((sum, job) => sum + job.jobValue, 0) || 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map(column => (
        <div key={column.key} className="space-y-3">
          {/* Column Header */}
          <div className={`p-3 rounded-lg border-l-4 ${column.borderColor} bg-slate-50`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${column.color}`} />
                <span className="font-semibold text-slate-900">{column.title}</span>
              </div>
              <Badge variant="secondary">
                {jobsByStatus[column.key]?.length || 0}
              </Badge>
            </div>
            <div className="text-sm text-slate-500 mt-1">
              Total: {formatCurrency(getColumnTotal(column.key))}
            </div>
          </div>

          {/* Column Cards */}
          <div className="space-y-2 min-h-[200px]">
            {jobsByStatus[column.key]?.map(job => (
              <Card
                key={job.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                style={{ borderLeftColor: job.subcontractor?.color || '#6b7280' }}
                onClick={() => onJobClick(job)}
              >
                <CardContent className="p-3 space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{job.jobNumber}</span>
                    {job.subcontractor && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: job.subcontractor.color,
                          color: job.subcontractor.color
                        }}
                      >
                        {job.subcontractor.name}
                      </Badge>
                    )}
                  </div>

                  {/* Client */}
                  <div className="flex items-center gap-1 text-sm">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="font-medium truncate">{job.clientName}</span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{job.address}, {job.city}</span>
                  </div>

                  {/* Date */}
                  {job.scheduledStartDate && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(job.scheduledStartDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                        {job.scheduledEndDate && job.scheduledEndDate !== job.scheduledStartDate && (
                          <> - {new Date(job.scheduledEndDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}</>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Value */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <DollarSign className="w-3 h-3" />
                      <span className="text-sm">{formatCurrency(job.jobValue)}</span>
                    </div>

                    {/* Payment Status Indicators */}
                    <div className="flex gap-1">
                      {job.depositPaid && (
                        <span className="w-2 h-2 rounded-full bg-green-500" title="Deposit Paid" />
                      )}
                      {job.jobPaid && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Job Paid" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {(!jobsByStatus[column.key] || jobsByStatus[column.key].length === 0) && (
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-lg">
                <span className="text-sm text-slate-400">No jobs</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

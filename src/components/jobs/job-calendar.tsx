'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Job, Subcontractor } from '@/types';

interface JobCalendarProps {
  jobs: Job[];
  subcontractors: Subcontractor[];
  onJobClick: (job: Job) => void;
}

type ViewMode = 'month' | 'week';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function JobCalendar({ jobs, subcontractors, onJobClick }: JobCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Filter only scheduled jobs
  const scheduledJobs = useMemo(() => {
    return jobs.filter(job => job.status === 'scheduled' || job.scheduledStartDate);
  }, [jobs]);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar days for the current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [currentDate]);

  // Get week days for the current week
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
  }, [currentDate]);

  // Get jobs for a specific date
  const getJobsForDate = (date: Date) => {
    return scheduledJobs.filter(job => {
      if (!job.scheduledStartDate) return false;
      const startDate = new Date(job.scheduledStartDate);
      const endDate = job.scheduledEndDate ? new Date(job.scheduledEndDate) : startDate;
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      const jobStart = new Date(startDate);
      jobStart.setHours(0, 0, 0, 0);
      const jobEnd = new Date(endDate);
      jobEnd.setHours(23, 59, 59, 999);

      return dateStart <= jobEnd && dateEnd >= jobStart;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getJobColor = (job: Job) => {
    const color = job.subcontractor?.color || '#6b7280';
    return color.startsWith('#') ? color : '#6b7280';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            <Grid3X3 className="w-4 h-4 mr-1" />
            Month
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            <List className="w-4 h-4 mr-1" />
            Week
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateWeek(1)}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-24 bg-slate-50 rounded-lg" />;
                }

                const dayJobs = getJobsForDate(day);
                const today = isToday(day);

                return (
                  <div
                    key={index}
                    className={cn(
                      "h-24 p-1 border rounded-lg overflow-hidden",
                      today ? "border-blue-500 bg-blue-50" : "border-slate-200",
                      "hover:border-blue-300 transition-colors"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      today ? "text-blue-600" : "text-slate-700"
                    )}>
                      {day.getDate()}
                    </div>

                    <div className="space-y-0.5">
                      {dayJobs.slice(0, 2).map(job => (
                        <div
                          key={job.id}
                          className="text-xs px-1 py-0.5 rounded truncate cursor-pointer text-white"
                          style={{ backgroundColor: getJobColor(job) }}
                          onClick={() => {
                            setSelectedJob(job);
                            onJobClick(job);
                          }}
                          title={`${job.jobNumber} - ${job.clientName}`}
                        >
                          {job.clientName}
                        </div>
                      ))}
                      {dayJobs.length > 2 && (
                        <div className="text-xs text-slate-500 px-1">
                          +{dayJobs.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const dayJobs = getJobsForDate(day);
                const today = isToday(day);

                return (
                  <div
                    key={index}
                    className={cn(
                      "min-h-[200px] p-2 border rounded-lg",
                      today ? "border-blue-500 bg-blue-50" : "border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "text-center mb-2",
                      today ? "text-blue-600" : "text-slate-700"
                    )}>
                      <div className="text-sm font-medium">{WEEKDAYS[index]}</div>
                      <div className="text-2xl font-bold">{day.getDate()}</div>
                    </div>

                    <div className="space-y-1">
                      {dayJobs.map(job => (
                        <div
                          key={job.id}
                          className="text-xs px-2 py-1 rounded cursor-pointer text-white"
                          style={{ backgroundColor: getJobColor(job) }}
                          onClick={() => {
                            setSelectedJob(job);
                            onJobClick(job);
                          }}
                        >
                          <div className="font-medium truncate">{job.clientName}</div>
                          <div className="opacity-80 truncate">{job.address}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Legend - Crews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {subcontractors.map(sub => (
              <div key={sub.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: sub.color || '#6b7280' }}
                />
                <span className="text-sm">{sub.name}</span>
              </div>
            ))}
            {subcontractors.length === 0 && (
              <span className="text-sm text-slate-500">No subcontractors registered</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

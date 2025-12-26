'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, MapPin, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface CalendarViewProps {
  jobs: Job[];
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function CalendarView({ jobs }: CalendarViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

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

    while (days.length < 42) {
      days.push(null);
    }

    return days;
  }, [currentDate]);

  const getJobsForDate = (date: Date): Job[] => {
    return jobs.filter(job => {
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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const selectedDateJobs = getJobsForDate(selectedDate);

  return (
    <div className="space-y-4">
      {/* Calendar Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(-1)}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <CardTitle className="text-lg font-bold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(1)}
              className="h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((day, idx) => (
              <div key={idx} className="text-center text-xs font-bold text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={index} className="h-11" />;
              }

              const dayJobs = getJobsForDate(day);
              const hasJobs = dayJobs.length > 0;
              const today = isToday(day);
              const selected = isSelected(day);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "h-11 rounded-xl flex flex-col items-center justify-center relative transition-all",
                    today && !selected && "bg-blue-100 text-blue-700 font-bold",
                    selected && "bg-blue-600 text-white shadow-lg scale-105",
                    !today && !selected && "hover:bg-slate-100 active:scale-95"
                  )}
                >
                  <span className={cn(
                    "text-sm font-semibold",
                    selected && "text-white"
                  )}>
                    {day.getDate()}
                  </span>
                  {hasJobs && !selected && (
                    <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                  {hasJobs && selected && (
                    <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Info */}
      <div className="px-1">
        <h3 className="font-bold text-slate-700 mb-3">
          {selectedDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </h3>

        {selectedDateJobs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-slate-500">Nenhum trabalho neste dia</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {selectedDateJobs.map(job => (
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
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-900 truncate flex-1">
                      {job.address}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Progress value={job.progress} className="h-2 w-20" />
                      <span className="text-xs text-slate-500">{job.progress}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatCurrency(job.subcontractorPrice || 0)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

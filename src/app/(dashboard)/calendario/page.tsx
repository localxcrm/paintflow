'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Grid3X3,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Subcontractor {
  id: string;
  name: string;
  color: string;
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
  jobValue: number;
  Subcontractor: Subcontractor | null;
}

type ViewMode = 'month' | 'week';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CalendarioPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [jobsRes, subsRes] = await Promise.all([
        fetch('/api/jobs?status=scheduled'),
        fetch('/api/subcontractors')
      ]);

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs || []);
      }

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubcontractors(subsData.subcontractors || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

    // Add padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Add padding to complete the last week
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
    return jobs.filter(job => {
      if (!job.scheduledStartDate) return false;
      const startDate = new Date(job.scheduledStartDate);
      const endDate = job.scheduledEndDate ? new Date(job.scheduledEndDate) : startDate;
      return date >= new Date(startDate.setHours(0,0,0,0)) &&
             date <= new Date(endDate.setHours(23,59,59,999));
    });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Carregando calendário...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendário</h1>
          <p className="text-slate-500">Visualize os trabalhos agendados</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            <Grid3X3 className="w-4 h-4 mr-1" />
            Mês
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            <List className="w-4 h-4 mr-1" />
            Semana
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
                Hoje
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
                          className={cn(
                            "text-xs px-1 py-0.5 rounded truncate cursor-pointer text-white",
                            job.Subcontractor?.color || 'bg-gray-500'
                          )}
                          onClick={() => setSelectedJob(job)}
                          title={`${job.jobNumber} - ${job.clientName}`}
                        >
                          {job.clientName}
                        </div>
                      ))}
                      {dayJobs.length > 2 && (
                        <div className="text-xs text-slate-500 px-1">
                          +{dayJobs.length - 2} mais
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
                          className={cn(
                            "text-xs px-2 py-1 rounded cursor-pointer text-white",
                            job.Subcontractor?.color || 'bg-gray-500'
                          )}
                          onClick={() => setSelectedJob(job)}
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
          <CardTitle className="text-sm font-medium">Legenda - Equipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {subcontractors.map(sub => (
              <div key={sub.id} className="flex items-center gap-2">
                <div className={cn("w-4 h-4 rounded", sub.color || 'bg-gray-500')} />
                <span className="text-sm">{sub.name}</span>
              </div>
            ))}
            {subcontractors.length === 0 && (
              <span className="text-sm text-slate-500">Nenhum subcontratado cadastrado</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedJob(null)}>
          <Card className="w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedJob.jobNumber}</CardTitle>
                <Badge className={selectedJob.Subcontractor?.color || 'bg-gray-500'}>
                  {selectedJob.Subcontractor?.name || 'Sem equipe'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-slate-500">Cliente</div>
                <div className="font-medium">{selectedJob.clientName}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Endereço</div>
                <div className="font-medium">{selectedJob.address}, {selectedJob.city}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-500">Início</div>
                  <div className="font-medium">
                    {selectedJob.scheduledStartDate
                      ? new Date(selectedJob.scheduledStartDate).toLocaleDateString('pt-BR')
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Término</div>
                  <div className="font-medium">
                    {selectedJob.scheduledEndDate
                      ? new Date(selectedJob.scheduledEndDate).toLocaleDateString('pt-BR')
                      : '-'}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Valor</div>
                <div className="font-medium text-lg text-green-600">
                  {formatCurrency(selectedJob.jobValue)}
                </div>
              </div>
              <div className="pt-2">
                <Button
                  className="w-full"
                  onClick={() => window.location.href = `/jobs/${selectedJob.id}`}
                >
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

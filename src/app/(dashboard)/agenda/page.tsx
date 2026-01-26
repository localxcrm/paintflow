'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { CalendarView } from '@/components/scheduling/calendar-view';
import { fetchSchedules } from '@/lib/api/schedules';
import type { CalendarEvent, CalendarViewType } from '@/types/scheduling';

export default function AgendaPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [currentRange, setCurrentRange] = useState(() => {
    const now = new Date();
    return {
      start: startOfWeek(startOfMonth(now)),
      end: endOfWeek(endOfMonth(now)),
    };
  });

  const loadEvents = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const startDate = format(currentRange.start, 'yyyy-MM-dd');
      const endDate = format(currentRange.end, 'yyyy-MM-dd');

      const response = await fetchSchedules(startDate, endDate);

      if (response.error) {
        console.error('Failed to load schedules:', response.error);
        toast.error('Erro ao carregar agenda');
        return;
      }

      if (response.data) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentRange]);

  // Load events when range changes
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Handle date range change from calendar
  const handleDateRangeChange = useCallback((start: Date, end: Date) => {
    // Extend range to include full weeks
    setCurrentRange({
      start: startOfWeek(start),
      end: endOfWeek(end),
    });
  }, []);

  // Handle event click
  const handleEventClick = useCallback((event: CalendarEvent) => {
    // Navigate to job details
    window.location.href = `/jobs/${event.jobId}`;
  }, []);

  // Handle date click (for adding new schedule)
  const handleDateClick = useCallback((date: Date) => {
    // Could open a modal to add a new schedule
    console.log('Date clicked:', date);
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    loadEvents(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-500">
            Visualize e gerencie o cronograma de trabalhos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
            Atualizar
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 p-4">
        <CalendarView
          events={events}
          viewType={viewType}
          onViewTypeChange={setViewType}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>
    </div>
  );
}

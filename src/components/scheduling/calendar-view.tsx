'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDayCell, CalendarEventCard } from './calendar-day-cell';
import type { CalendarEvent, CalendarViewType, CalendarDayData } from '@/types/scheduling';

interface CalendarViewProps {
  /** Events to display */
  events: CalendarEvent[];
  /** Current view type */
  viewType?: CalendarViewType;
  /** Callback when view type changes */
  onViewTypeChange?: (type: CalendarViewType) => void;
  /** Callback when date is clicked */
  onDateClick?: (date: Date) => void;
  /** Callback when event is clicked */
  onEventClick?: (event: CalendarEvent) => void;
  /** Callback when date range changes */
  onDateRangeChange?: (start: Date, end: Date) => void;
  /** Loading state */
  isLoading?: boolean;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Calendar view for scheduling
 */
export function CalendarView({
  events,
  viewType = 'month',
  onViewTypeChange,
  onDateClick,
  onEventClick,
  onDateRangeChange,
  isLoading = false,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get date range based on view type
  const dateRange = useMemo(() => {
    if (viewType === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return { start, end };
    } else if (viewType === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return { start, end };
    } else {
      return { start: currentDate, end: currentDate };
    }
  }, [currentDate, viewType]);

  // Get all days to display
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const dateKey = event.scheduledDate;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    }
    return map;
  }, [events]);

  // Create day data for each calendar day
  const dayDataList: CalendarDayData[] = useMemo(() => {
    return calendarDays.map((date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return {
        date,
        isToday: isToday(date),
        isCurrentMonth: isSameMonth(date, currentDate),
        events: eventsByDate.get(dateKey) || [],
      };
    });
  }, [calendarDays, currentDate, eventsByDate]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (viewType === 'month') {
      const newDate = subMonths(currentDate, 1);
      setCurrentDate(newDate);
      onDateRangeChange?.(startOfMonth(newDate), endOfMonth(newDate));
    } else if (viewType === 'week') {
      const newDate = subWeeks(currentDate, 1);
      setCurrentDate(newDate);
      onDateRangeChange?.(startOfWeek(newDate), endOfWeek(newDate));
    }
  }, [currentDate, viewType, onDateRangeChange]);

  const handleNext = useCallback(() => {
    if (viewType === 'month') {
      const newDate = addMonths(currentDate, 1);
      setCurrentDate(newDate);
      onDateRangeChange?.(startOfMonth(newDate), endOfMonth(newDate));
    } else if (viewType === 'week') {
      const newDate = addWeeks(currentDate, 1);
      setCurrentDate(newDate);
      onDateRangeChange?.(startOfWeek(newDate), endOfWeek(newDate));
    }
  }, [currentDate, viewType, onDateRangeChange]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    onDateRangeChange?.(startOfMonth(today), endOfMonth(today));
  }, [onDateRangeChange]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  }, [onDateClick]);

  // Get title based on view type
  const title = useMemo(() => {
    if (viewType === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    } else if (viewType === 'week') {
      return `Semana de ${format(dateRange.start, 'd MMM', { locale: ptBR })} - ${format(dateRange.end, 'd MMM', { locale: ptBR })}`;
    }
    return format(currentDate, 'd MMMM yyyy', { locale: ptBR });
  }, [currentDate, viewType, dateRange]);

  // Get selected day events
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate.get(dateKey) || [];
  }, [selectedDate, eventsByDate]);

  return (
    <div className="flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Hoje
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 capitalize">
            {title}
          </h2>
        </div>

        <Tabs
          value={viewType}
          onValueChange={(v) => onViewTypeChange?.(v as CalendarViewType)}
        >
          <TabsList>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="day">Dia</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-sm font-medium text-slate-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="flex-1 grid grid-cols-7 overflow-auto">
            {dayDataList.map((dayData) => (
              <CalendarDayCell
                key={dayData.date.toISOString()}
                data={dayData}
                onClick={handleDateClick}
                onEventClick={onEventClick}
              />
            ))}
          </div>
        </div>

        {/* Side panel for selected day */}
        {selectedDate && (
          <div className="w-80 border-l border-slate-200 pl-4 overflow-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {format(selectedDate, 'd MMMM yyyy', { locale: ptBR })}
            </h3>

            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum trabalho agendado para este dia.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event) => (
                  <CalendarEventCard
                    key={event.scheduleId}
                    event={event}
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

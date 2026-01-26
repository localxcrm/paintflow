'use client';

import { cn } from '@/lib/utils';
import type { CalendarEvent, CalendarDayData } from '@/types/scheduling';
import { format } from 'date-fns';

interface CalendarDayCellProps {
  data: CalendarDayData;
  onClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  maxEventsToShow?: number;
}

/**
 * Single day cell for calendar grid
 */
export function CalendarDayCell({
  data,
  onClick,
  onEventClick,
  maxEventsToShow = 3,
}: CalendarDayCellProps) {
  const { date, isToday, isCurrentMonth, events } = data;
  const visibleEvents = events.slice(0, maxEventsToShow);
  const hiddenCount = events.length - maxEventsToShow;

  return (
    <div
      className={cn(
        'min-h-[100px] border border-slate-200 p-1 cursor-pointer transition-colors',
        isCurrentMonth ? 'bg-white' : 'bg-slate-50',
        isToday && 'ring-2 ring-blue-500 ring-inset',
        onClick && 'hover:bg-slate-50'
      )}
      onClick={() => onClick?.(date)}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
            isToday && 'bg-blue-600 text-white',
            !isToday && isCurrentMonth && 'text-slate-900',
            !isToday && !isCurrentMonth && 'text-slate-400'
          )}
        >
          {format(date, 'd')}
        </span>
      </div>

      {/* Events */}
      <div className="space-y-0.5">
        {visibleEvents.map((event) => (
          <CalendarEventPill
            key={event.scheduleId}
            event={event}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick?.(event);
            }}
          />
        ))}

        {/* More indicator */}
        {hiddenCount > 0 && (
          <div className="text-xs text-slate-500 font-medium px-1">
            +{hiddenCount} mais
          </div>
        )}
      </div>
    </div>
  );
}

interface CalendarEventPillProps {
  event: CalendarEvent;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Small pill showing event in calendar
 */
function CalendarEventPill({ event, onClick }: CalendarEventPillProps) {
  // Get color from first assignment or default
  const color = event.assignments[0]?.subcontractorColor || '#3b82f6';

  return (
    <div
      className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
      style={{ backgroundColor: color + '20', color: color, borderLeft: `3px solid ${color}` }}
      onClick={onClick}
      title={`${event.jobNumber} - ${event.clientName}`}
    >
      {event.startTime && (
        <span className="font-medium mr-1">{event.startTime.slice(0, 5)}</span>
      )}
      {event.jobNumber}
    </div>
  );
}

/**
 * Detailed event card for expanded view
 */
interface CalendarEventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
}

export function CalendarEventCard({ event, onClick }: CalendarEventCardProps) {
  return (
    <div
      className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-900 truncate">
            {event.jobNumber}
          </div>
          <div className="text-sm text-slate-600 truncate">
            {event.clientName}
          </div>
          <div className="text-xs text-slate-500 truncate mt-1">
            {event.address}
          </div>
        </div>

        {event.startTime && (
          <div className="text-sm font-medium text-slate-700 whitespace-nowrap">
            {event.startTime.slice(0, 5)}
            {event.endTime && ` - ${event.endTime.slice(0, 5)}`}
          </div>
        )}
      </div>

      {/* Assigned subs */}
      {event.assignments.length > 0 && (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          {event.assignments.map((assignment) => (
            <span
              key={assignment.assignmentId}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: assignment.subcontractorColor + '20',
                color: assignment.subcontractorColor,
              }}
            >
              {assignment.subcontractorName}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

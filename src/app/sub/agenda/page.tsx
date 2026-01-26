'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ScheduleItem {
  assignmentId: string;
  assignmentStatus: string;
  notes: string | null;
  scheduledDate: string;
  startTime: string | null;
  endTime: string | null;
  estimatedHours: number | null;
  job: {
    id: string;
    jobNumber: string;
    clientName: string;
    address: string;
    city: string;
    projectType: string;
    status: string;
  };
}

export default function SubAgendaPage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSchedule = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch('/api/sub/schedule');
      const data = await response.json();

      if (data.error) {
        toast.error('Erro ao carregar agenda');
        return;
      }

      setSchedule(data.schedule || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Group schedule by date
  const groupedSchedule = schedule.reduce((acc, item) => {
    const date = item.scheduledDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  const sortedDates = Object.keys(groupedSchedule).sort();

  // Format date header
  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      assigned: { label: 'Atribuído', variant: 'secondary' },
      confirmed: { label: 'Confirmado', variant: 'default' },
      in_progress: { label: 'Em Andamento', variant: 'default' },
      completed: { label: 'Concluído', variant: 'outline' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
    };
    const info = statusMap[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Minha Agenda</h1>
          <p className="text-sm text-slate-500">
            Próximos trabalhos agendados
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => loadSchedule(true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn('w-5 h-5', refreshing && 'animate-spin')} />
        </Button>
      </div>

      {/* Empty state */}
      {sortedDates.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">
            Nenhum trabalho agendado
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Você será notificado quando houver novos trabalhos
          </p>
        </div>
      )}

      {/* Schedule by date */}
      {sortedDates.map((date) => (
        <div key={date} className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            {formatDateHeader(date)}
          </h2>

          {groupedSchedule[date].map((item) => (
            <Link key={item.assignmentId} href={`/sub/os/${item.job.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">
                          {item.job.jobNumber}
                        </span>
                        {getStatusBadge(item.assignmentStatus)}
                      </div>
                      <p className="text-slate-700 font-medium truncate">
                        {item.job.clientName}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{item.job.address}</span>
                      </div>
                      {item.startTime && (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {item.startTime.slice(0, 5)}
                            {item.endTime && ` - ${item.endTime.slice(0, 5)}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, parseISO, subWeeks, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Clock,
  DollarSign,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TimeEntryForm } from '@/components/sub/time-entry-form';
import type { SubcontractorEmployee } from '@/types/database';
import type { TimeEntryFormData } from '@/lib/validations/time-entry';

interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
}

interface TimeEntry {
  id: string;
  workDate: string;
  hoursWorked: number;
  notes: string | null;
  employee: {
    id: string;
    name: string;
    hourlyRate: number;
    isOwner: boolean;
  };
  job: {
    id: string;
    jobNumber: string;
    clientName: string;
  };
  laborCost: number;
}

type BreakPolicy = 'paid' | 'deduct30' | 'deduct60';

export default function HorasPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<SubcontractorEmployee[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [breakPolicy, setBreakPolicy] = useState<BreakPolicy>('paid');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<TimeEntry | null>(null);

  // Date filter state
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empRes, jobsRes, meRes] = await Promise.all([
        fetch('/api/sub/employees'),
        fetch('/api/sub/jobs'),
        fetch('/api/sub/me'),
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        const jobList = jobsData.jobs.map((j: any) => ({
          id: j.id,
          jobNumber: j.jobNumber,
          clientName: j.clientName,
        }));
        setJobs(jobList);
      }

      if (meRes.ok) {
        setBreakPolicy('paid');
      }

      // Load time entries with date filter
      const startDate = format(dateRange.start, 'yyyy-MM-dd');
      const endDate = format(dateRange.end, 'yyyy-MM-dd');
      const entriesRes = await fetch(
        `/api/sub/time-entries?startDate=${startDate}&endDate=${endDate}`
      );
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setTimeEntries(entriesData.timeEntries || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Week navigation
  const goToPreviousWeek = () => {
    setDateRange({
      start: subWeeks(dateRange.start, 1),
      end: subWeeks(dateRange.end, 1),
    });
  };

  const goToNextWeek = () => {
    const nextStart = addWeeks(dateRange.start, 1);
    const today = new Date();
    if (nextStart <= today) {
      setDateRange({
        start: nextStart,
        end: addWeeks(dateRange.end, 1),
      });
    }
  };

  const goToCurrentWeek = () => {
    setDateRange({
      start: startOfWeek(new Date(), { weekStartsOn: 1 }),
      end: endOfWeek(new Date(), { weekStartsOn: 1 }),
    });
  };

  // Check if current week is selected
  const isCurrentWeek = format(dateRange.start, 'yyyy-MM-dd') ===
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Calculate week summary
  const weekSummary = {
    totalHours: timeEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0),
    totalCost: timeEntries.reduce((sum, entry) => sum + entry.laborCost, 0),
  };

  // Group entries by date
  const entriesByDate = timeEntries.reduce((acc, entry) => {
    const date = entry.workDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  const sortedDates = Object.keys(entriesByDate).sort((a, b) => b.localeCompare(a));

  const handleAdd = () => {
    setSelectedEntry(null);
    setIsFormOpen(true);
  };

  const handleEdit = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setIsFormOpen(true);
  };

  const handleSave = async (data: TimeEntryFormData) => {
    try {
      const url = selectedEntry
        ? `/api/sub/time-entries/${selectedEntry.id}`
        : '/api/sub/time-entries';
      const method = selectedEntry ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success(selectedEntry ? 'Entrada atualizada!' : 'Entrada adicionada!');
      setIsFormOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar entrada');
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;

    try {
      const res = await fetch(`/api/sub/time-entries/${deleteEntry.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erro ao deletar');
      }

      toast.success('Entrada removida!');
      setDeleteEntry(null);
      loadData();
    } catch (error) {
      toast.error('Erro ao deletar entrada');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F2F2F7]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
          <p className="text-slate-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-20">
      {/* Header */}
      <header className="bg-white px-4 pt-6 pb-4 safe-area-top border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Horas</h1>
          <button
            onClick={handleAdd}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-blue-600/30"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center justify-between bg-slate-100 rounded-xl p-1">
          <button
            onClick={goToPreviousWeek}
            className="w-10 h-10 rounded-lg flex items-center justify-center active:bg-slate-200 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>

          <button
            onClick={goToCurrentWeek}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all",
              isCurrentWeek
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 active:bg-slate-200"
            )}
          >
            {format(dateRange.start, 'dd MMM', { locale: ptBR })} - {format(dateRange.end, 'dd MMM', { locale: ptBR })}
          </button>

          <button
            onClick={goToNextWeek}
            disabled={isCurrentWeek}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              isCurrentWeek
                ? "text-slate-300"
                : "text-slate-600 active:bg-slate-200"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Total Hours */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {weekSummary.totalHours.toFixed(1)}h
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Total Horas</p>
          </div>

          {/* Total Cost */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ${weekSummary.totalCost.toFixed(0)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Custo Total</p>
          </div>
        </div>
      </div>

      {/* Time Entries List */}
      <div className="px-4 space-y-4">
        {sortedDates.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhuma hora registrada
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Adicione suas primeiras horas trabalhadas
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm active:scale-95 transition-transform"
            >
              <Plus className="h-4 w-4" />
              Adicionar Horas
            </button>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date}>
              {/* Date Header */}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                {format(parseISO(date), 'EEEE, dd MMM', { locale: ptBR })}
              </p>

              {/* Entries for this date */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
                {entriesByDate[date].map((entry) => (
                  <div key={entry.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 truncate">
                            {entry.employee.name}
                          </span>
                          {entry.employee.isOwner && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">
                              Dono
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-500 mb-2 truncate">
                          #{entry.job.jobNumber} - {entry.job.clientName}
                        </p>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold text-slate-900">
                              {entry.hoursWorked.toFixed(1)}h
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="font-semibold text-slate-900">
                              ${entry.laborCost.toFixed(0)}
                            </span>
                          </div>
                        </div>

                        {entry.notes && (
                          <p className="mt-2 text-sm text-slate-400 italic line-clamp-2">
                            {entry.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                            <MoreHorizontal className="h-5 w-5 text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleEdit(entry)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteEntry(entry)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedEntry ? 'Editar Horas' : 'Adicionar Horas'}
            </DialogTitle>
          </DialogHeader>
          <TimeEntryForm
            employees={employees}
            jobs={jobs}
            breakPolicy={breakPolicy}
            timeEntry={
              selectedEntry
                ? {
                    id: selectedEntry.id,
                    employeeId: selectedEntry.employee.id,
                    jobId: selectedEntry.job.id,
                    workDate: selectedEntry.workDate,
                    notes: selectedEntry.notes,
                    hoursWorked: selectedEntry.hoursWorked,
                  }
                : undefined
            }
            onSave={handleSave}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <AlertDialogContent className="mx-4 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta entrada de horas? Esta acao nao pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

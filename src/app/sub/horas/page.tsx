'use client';

import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Clock,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimeEntryForm } from '@/components/sub/time-entry-form';
import type { SubcontractorEmployee } from '@/types/database';
import type { TimeEntryFormData } from '@/lib/validations/time-entry';
import { cn } from '@/lib/utils';

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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load employees
      const empRes = await fetch('/api/sub/employees');
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }

      // Load jobs - get from SubcontractorPayout
      const jobsRes = await fetch('/api/sub/jobs');
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        // Extract unique jobs
        const jobList = jobsData.jobs.map((j: any) => ({
          id: j.id,
          jobNumber: j.jobNumber,
          clientName: j.clientName,
        }));
        setJobs(jobList);
      }

      // Load subcontractor settings for break policy
      const meRes = await fetch('/api/sub/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        // TODO: When Subcontractor schema extended, get breakPolicy from meData.subcontractor.breakPolicy
        // For now, default to 'paid'
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
  };

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

  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    setDateRange(range);
    setIsDatePickerOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Horas</h1>
          <Button
            onClick={handleAdd}
            size="sm"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white/10 backdrop-blur border-white/20 p-4">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
              <Clock className="h-4 w-4" />
              Esta Semana
            </div>
            <div className="text-2xl font-bold">
              {weekSummary.totalHours.toFixed(1)}h
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20 p-4">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Custo Total
            </div>
            <div className="text-2xl font-bold">
              ${weekSummary.totalCost.toFixed(2)}
            </div>
          </Card>
        </div>

        {/* Date Filter */}
        <div className="mt-4">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.start, 'dd MMM', { locale: ptBR })} -{' '}
                {format(dateRange.end, 'dd MMM yyyy', { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-2">
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
                      const end = endOfWeek(new Date(), { weekStartsOn: 1 });
                      handleDateRangeChange({ start, end });
                    }}
                  >
                    Esta Semana
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const now = new Date();
                      const lastWeek = new Date(now.setDate(now.getDate() - 7));
                      const start = startOfWeek(lastWeek, { weekStartsOn: 1 });
                      const end = endOfWeek(lastWeek, { weekStartsOn: 1 });
                      handleDateRangeChange({ start, end });
                    }}
                  >
                    Semana Passada
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Time Entries List */}
      <div className="p-4 space-y-6">
        {sortedDates.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhuma hora registrada
            </h3>
            <p className="text-slate-500 mb-4">
              Adicione suas primeiras horas trabalhadas
            </p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Horas
            </Button>
          </Card>
        ) : (
          sortedDates.map((date) => (
            <div key={date} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <CalendarIcon className="h-4 w-4" />
                {format(parseISO(date), 'EEEE, dd \'de\' MMMM', { locale: ptBR })}
              </div>

              {/* Entries for this date */}
              {entriesByDate[date].map((entry) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">
                          {entry.employee.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          ${entry.employee.hourlyRate.toFixed(2)}/h
                        </Badge>
                      </div>

                      <div className="text-sm text-slate-600 mb-2">
                        #{entry.job.jobNumber} - {entry.job.clientName}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-blue-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">
                            {entry.hoursWorked.toFixed(2)}h
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">
                            ${entry.laborCost.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {entry.notes && (
                        <div className="mt-2 text-sm text-slate-500 italic">
                          {entry.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(entry)}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteEntry(entry)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta entrada de horas? Esta acao nao pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

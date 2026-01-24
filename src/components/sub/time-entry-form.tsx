'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { timeEntrySchema, type TimeEntryFormData } from '@/lib/validations/time-entry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { SubcontractorEmployee } from '@/types/database';

interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
}

interface TimeEntry {
  id: string;
  employeeId: string;
  jobId: string;
  workDate: string;
  startTime?: string;
  endTime?: string;
  notes?: string | null;
  hoursWorked?: number;
}

interface TimeEntryFormProps {
  employees: SubcontractorEmployee[];
  jobs: Job[];
  breakPolicy: 'paid' | 'deduct30' | 'deduct60';
  timeEntry?: TimeEntry;
  onSave: (data: TimeEntryFormData) => Promise<void>;
  onCancel: () => void;
}

export function TimeEntryForm({
  employees,
  jobs,
  breakPolicy,
  timeEntry,
  onSave,
  onCancel,
}: TimeEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    timeEntry?.workDate ? new Date(timeEntry.workDate) : new Date()
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: timeEntry
      ? {
          employeeId: timeEntry.employeeId,
          jobId: timeEntry.jobId,
          workDate: timeEntry.workDate,
          startTime: timeEntry.startTime || '08:00',
          endTime: timeEntry.endTime || '17:00',
          notes: timeEntry.notes || '',
        }
      : {
          workDate: format(new Date(), 'yyyy-MM-dd'),
          startTime: '08:00',
          endTime: '17:00',
          notes: '',
        },
  });

  const employeeId = watch('employeeId');
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  // Find selected employee for rate display
  const selectedEmployee = employees.find((e) => e.id === employeeId);

  // Calculate hours worked with break policy
  const calculatedHours = useMemo(() => {
    if (!startTime || !endTime) return 0;

    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMins = parseTime(startTime);
    const endMins = parseTime(endTime);

    if (endMins <= startMins) return 0;

    let hours = (endMins - startMins) / 60;

    // Apply break policy
    if (breakPolicy === 'deduct30') {
      hours -= 0.5;
    } else if (breakPolicy === 'deduct60') {
      hours -= 1;
    }

    return Math.max(0, hours);
  }, [startTime, endTime, breakPolicy]);

  // Calculate labor cost
  const laborCost = useMemo(() => {
    if (!selectedEmployee) return 0;
    return calculatedHours * selectedEmployee.hourlyRate;
  }, [calculatedHours, selectedEmployee]);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setValue('workDate', format(date, 'yyyy-MM-dd'));
    }
  };

  const onSubmit = async (data: TimeEntryFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Employee Select */}
      <div className="space-y-2">
        <Label htmlFor="employeeId">
          Funcionario <span className="text-red-500">*</span>
        </Label>
        <Select
          value={watch('employeeId') || ''}
          onValueChange={(value) => setValue('employeeId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um funcionario" />
          </SelectTrigger>
          <SelectContent>
            {employees.filter((e) => e.isActive).map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name} - ${Number(employee.hourlyRate).toFixed(2)}/h
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.employeeId && (
          <p className="text-sm text-red-500">{errors.employeeId.message}</p>
        )}
      </div>

      {/* Job Select */}
      <div className="space-y-2">
        <Label htmlFor="jobId">
          Trabalho <span className="text-red-500">*</span>
        </Label>
        <Select
          value={watch('jobId') || ''}
          onValueChange={(value) => setValue('jobId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um trabalho" />
          </SelectTrigger>
          <SelectContent>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                #{job.jobNumber} - {job.clientName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.jobId && (
          <p className="text-sm text-red-500">{errors.jobId.message}</p>
        )}
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label>
          Data <span className="text-red-500">*</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, 'PPP', { locale: ptBR })
              ) : (
                <span>Selecione a data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) =>
                date > new Date() || date < new Date('1900-01-01')
              }
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
        {errors.workDate && (
          <p className="text-sm text-red-500">{errors.workDate.message}</p>
        )}
      </div>

      {/* Time Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">
            Inicio <span className="text-red-500">*</span>
          </Label>
          <Input
            id="startTime"
            type="time"
            {...register('startTime')}
            className="w-full"
          />
          {errors.startTime && (
            <p className="text-sm text-red-500">{errors.startTime.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">
            Fim <span className="text-red-500">*</span>
          </Label>
          <Input
            id="endTime"
            type="time"
            {...register('endTime')}
            className="w-full"
          />
          {errors.endTime && (
            <p className="text-sm text-red-500">{errors.endTime.message}</p>
          )}
        </div>
      </div>

      {/* Hours Calculation Display */}
      {calculatedHours > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
          <div className="flex items-center gap-2 text-blue-900">
            <Clock className="h-5 w-5" />
            <div>
              <p className="font-semibold text-lg">
                Horas Trabalhadas: {calculatedHours.toFixed(2)}h
              </p>
              {breakPolicy !== 'paid' && (
                <p className="text-sm text-blue-700">
                  {breakPolicy === 'deduct30'
                    ? '(com 30min de pausa deduzidos)'
                    : '(com 1h de pausa deduzidos)'}
                </p>
              )}
            </div>
          </div>

          {selectedEmployee && (
            <div className="flex items-center gap-2 text-green-700 pt-2 border-t border-blue-200">
              <DollarSign className="h-5 w-5" />
              <p className="font-semibold text-lg">
                Custo: ${laborCost.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observacoes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Adicione notas sobre o trabalho realizado..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar'
          )}
        </Button>
      </div>
    </form>
  );
}

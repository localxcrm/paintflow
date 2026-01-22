import { z } from 'zod';

/**
 * Time entry validation schema
 * Validates time entry form data with start/end time validation
 */
export const timeEntrySchema = z.object({
  employeeId: z.string().uuid('Selecione um funcionario'),
  jobId: z.string().uuid('Selecione um trabalho'),
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
  notes: z.string().optional(),
}).refine((data) => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  const startMins = start[0] * 60 + start[1];
  const endMins = end[0] * 60 + end[1];
  return endMins > startMins;
}, {
  message: 'Horario final deve ser depois do inicial',
  path: ['endTime'],
});

export type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

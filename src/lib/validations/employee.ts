import { z } from 'zod';

/**
 * Employee validation schema
 * Validates employee form data for subcontractor portal
 *
 * Note: Schema includes extended fields (SSN, phone, etc.) for future use.
 * Current DB schema only stores: name, hourlyRate, isActive
 * These fields are validated but not persisted yet.
 */
export const employeeSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  ssn: z.union([
    z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'Formato: XXX-XX-XXXX'),
    z.literal('')
  ]).optional(),
  hourlyRate: z.number().min(0.01, 'Taxa horaria deve ser maior que $0'),
  phone: z.union([z.string(), z.literal('')]).optional(),
  address: z.union([z.string(), z.literal('')]).optional(),
  dateOfBirth: z.union([z.string(), z.literal('')]).optional(), // ISO date string
  emergencyContact: z.union([z.string(), z.literal('')]).optional(),
  isOwner: z.boolean(),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

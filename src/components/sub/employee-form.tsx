'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeSchema, type EmployeeFormData } from '@/lib/validations/employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { SubcontractorEmployee } from '@/types/database';

interface EmployeeFormProps {
  employee?: SubcontractorEmployee | null;
  onSave: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EmployeeForm({ employee, onSave, onCancel, isLoading = false }: EmployeeFormProps) {
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name || '',
      ssn: '',
      hourlyRate: employee?.hourlyRate || 0,
      phone: '',
      address: '',
      dateOfBirth: '',
      emergencyContact: '',
      isOwner: false,
    },
  });

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      form.reset({
        name: employee.name,
        ssn: '',
        hourlyRate: employee.hourlyRate,
        phone: '',
        address: '',
        dateOfBirth: '',
        emergencyContact: '',
        isOwner: false,
      });
    }
  }, [employee, form]);

  const handleSubmit = async (data: EmployeeFormData) => {
    await onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome do funcionario"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hourly Rate */}
        <FormField
          control={form.control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taxa Horaria *</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-8"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SSN */}
        <FormField
          control={form.control}
          name="ssn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SSN/ITIN</FormLabel>
              <FormControl>
                <Input
                  placeholder="XXX-XX-XXXX"
                  type="text"
                  maxLength={11}
                  {...field}
                  onChange={(e) => {
                    // Auto-format SSN as user types
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 3) {
                      value = value.slice(0, 3) + '-' + value.slice(3);
                    }
                    if (value.length > 6) {
                      value = value.slice(0, 6) + '-' + value.slice(6);
                    }
                    field.onChange(value.slice(0, 11));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereco</FormLabel>
              <FormControl>
                <Input
                  placeholder="Endereco completo"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date of Birth */}
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Nascimento</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Emergency Contact */}
        <FormField
          control={form.control}
          name="emergencyContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contato de Emergencia</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome e telefone"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Is Owner */}
        <FormField
          control={form.control}
          name="isOwner"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Proprietario (voce trabalha nos jobs)
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Salvando...' : employee ? 'Atualizar' : 'Adicionar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

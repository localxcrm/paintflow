'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Edit, Archive, DollarSign, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { EmployeeForm } from '@/components/sub/employee-form';
import type { EmployeeFormData } from '@/lib/validations/employee';
import type { SubcontractorEmployee } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface Employee extends SubcontractorEmployee {
  isOwner?: boolean;
  ssn?: string | null;
  phone?: string | null;
  totalHours?: number;
  totalEarned?: number;
}

export default function EquipePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormSaving, setIsFormSaving] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [employeeToArchive, setEmployeeToArchive] = useState<Employee | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/sub/employees');

      if (!res.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Erro ao carregar funcionarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleSaveEmployee = async (data: EmployeeFormData) => {
    try {
      setIsFormSaving(true);

      const url = selectedEmployee
        ? `/api/sub/employees/${selectedEmployee.id}`
        : '/api/sub/employees';

      const method = selectedEmployee ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to save employee');
      }

      toast.success(selectedEmployee ? 'Funcionario atualizado!' : 'Funcionario adicionado!');
      setIsFormOpen(false);
      setSelectedEmployee(null);
      await loadEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Erro ao salvar funcionario');
    } finally {
      setIsFormSaving(false);
    }
  };

  const handleArchiveEmployee = async () => {
    if (!employeeToArchive) return;

    try {
      const res = await fetch(`/api/sub/employees/${employeeToArchive.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to archive employee');
      }

      toast.success('Funcionario arquivado!');
      setEmployeeToArchive(null);
      await loadEmployees();
    } catch (error) {
      console.error('Error archiving employee:', error);
      toast.error('Erro ao arquivar funcionario');
    }
  };

  const activeEmployees = employees.filter(e => e.isActive);
  const inactiveEmployees = employees.filter(e => !e.isActive);
  const displayedEmployees = showInactive ? employees : activeEmployees;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 pt-6 pb-8 safe-area-top">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Equipe</h1>
            <p className="text-blue-200 text-sm mt-1">
              Gerencie seus funcionarios
            </p>
          </div>
          <Button
            onClick={handleAddEmployee}
            size="sm"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Summary Card */}
        <div className="flex items-center gap-4 mt-4 bg-white/10 rounded-xl p-3">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">{employees.length}</p>
            <p className="text-xs text-blue-200">Total</p>
          </div>
          <div className="w-px h-8 bg-blue-400/30" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">{activeEmployees.length}</p>
            <p className="text-xs text-blue-200">Ativos</p>
          </div>
          <div className="w-px h-8 bg-blue-400/30" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">
              {employees.filter(e => e.isOwner).length}
            </p>
            <p className="text-xs text-blue-200">Proprietarios</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4 -mt-4">
        {/* Toggle Archived */}
        {inactiveEmployees.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
              className="text-slate-600"
            >
              {showInactive ? 'Ocultar arquivados' : 'Mostrar arquivados'}
            </Button>
          </div>
        )}

        {/* Employee List */}
        {displayedEmployees.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-center mb-4">
                Nenhum funcionario cadastrado
              </p>
              <Button onClick={handleAddEmployee}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Funcionario
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayedEmployees.map(employee => (
              <Card
                key={employee.id}
                className={!employee.isActive ? 'opacity-60' : ''}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">
                          {employee.name}
                        </h3>
                        {employee.isOwner && (
                          <Badge variant="secondary" className="text-xs">
                            Proprietario
                          </Badge>
                        )}
                        {!employee.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Arquivado
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-slate-600 mb-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">
                          ${employee.hourlyRate.toFixed(2)}/hora
                        </span>
                      </div>

                      {employee.totalHours !== undefined && employee.totalHours > 0 && (
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{employee.totalHours}h trabalhadas</span>
                          <span>
                            ${(employee.totalEarned || 0).toFixed(2)} ganhos
                          </span>
                        </div>
                      )}
                    </div>

                    {employee.isActive && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEmployee(employee)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEmployeeToArchive(employee)}
                          className="text-slate-500 hover:bg-slate-100"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Employee Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? 'Editar Funcionario' : 'Adicionar Funcionario'}
            </DialogTitle>
          </DialogHeader>
          <EmployeeForm
            employee={selectedEmployee}
            onSave={handleSaveEmployee}
            onCancel={() => setIsFormOpen(false)}
            isLoading={isFormSaving}
          />
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog
        open={!!employeeToArchive}
        onOpenChange={() => setEmployeeToArchive(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar funcionario?</AlertDialogTitle>
            <AlertDialogDescription>
              {employeeToArchive?.name} sera marcado como inativo e nao aparecera na lista principal.
              Voce pode reativa-lo posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveEmployee}>
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PaymentStatusBadge } from './payment-status-badge';
import { MarkPaidDialog } from './mark-paid-dialog';
import { useState } from 'react';
import type { Job, SubcontractorPayout, SubcontractorPayment, TimeEntry, SubcontractorEmployee, JobMaterialCost } from '@/types/database';

// Type definitions matching 03-01 spec
interface TimeEntryWithEmployee extends TimeEntry {
  SubcontractorEmployee: Pick<SubcontractorEmployee, 'id' | 'name' | 'hourlyRate'>;
}

export interface JobCostDetail {
  jobId: string;
  timeEntries: TimeEntryWithEmployee[];
  materialCost: JobMaterialCost | null;
  totalLaborCost: number;
  totalMaterialCost: number;
}

export interface PayoutWithDetails extends SubcontractorPayout {
  Job: Pick<Job, 'id' | 'jobNumber' | 'clientName' | 'address' | 'jobDate' | 'status'>;
  SubcontractorPayment: SubcontractorPayment[];
}

interface CostBreakdownCardProps {
  payout: PayoutWithDetails;
  jobCost: JobCostDetail | null;
  subcontractorId: string;
  subcontractorName: string;
  onPaymentSuccess?: () => void;
}

export function CostBreakdownCard({
  payout,
  jobCost,
  subcontractorId,
  subcontractorName,
  onPaymentSuccess,
}: CostBreakdownCardProps) {
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SubcontractorPayment | null>(null);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const hasDeductions = payout.deductions > 0;
  const hasPendingPayments = payout.SubcontractorPayment.some(p => p.status === 'pending');

  const handleMarkAsPaid = (payment: SubcontractorPayment) => {
    setSelectedPayment(payment);
    setMarkPaidDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    onPaymentSuccess?.();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Custos - Job #{payout.Job.jobNumber}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payout Calculation */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700">Calculo do Pagamento</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Valor do Job:</span>
                <span className="font-medium">{formatCurrency(payout.jobValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Percentual ({payout.payoutPct}%):</span>
                <span className="font-medium">{formatCurrency(payout.calculatedPayout)}</span>
              </div>

              <Separator className="my-3" />

              <div className="flex justify-between">
                <span className="text-slate-600">(-) Custo de Mao de Obra:</span>
                <span className="font-medium text-red-600">-{formatCurrency(payout.totalLaborCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">(-) Custo de Materiais:</span>
                <span className="font-medium text-red-600">-{formatCurrency(payout.totalMaterialCost)}</span>
              </div>
              {hasDeductions && (
                <div className="flex justify-between">
                  <span className="text-slate-600">(-) Deducoes:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(payout.deductions)}</span>
                </div>
              )}

              <Separator className="my-3" />

              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Valor Final:</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(payout.finalPayout)}</span>
              </div>
            </div>
          </div>

          {/* Labor Detail */}
          {jobCost && jobCost.timeEntries.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Horas Trabalhadas</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionario</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Horas</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobCost.timeEntries.map((entry) => {
                      const total = entry.hoursWorked * entry.SubcontractorEmployee.hourlyRate;
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {entry.SubcontractorEmployee.name}
                          </TableCell>
                          <TableCell>{formatDate(entry.workDate)}</TableCell>
                          <TableCell className="text-right">{entry.hoursWorked}h</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(entry.SubcontractorEmployee.hourlyRate)}/h
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-slate-50 font-semibold">
                      <TableCell colSpan={4}>Total de Mao de Obra</TableCell>
                      <TableCell className="text-right">{formatCurrency(jobCost.totalLaborCost)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Material Detail */}
          {jobCost && jobCost.materialCost && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Materiais</h3>
              <div className="p-4 rounded-md border bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total:</span>
                  <span className="font-semibold text-lg">{formatCurrency(jobCost.materialCost.totalCost)}</span>
                </div>
                {jobCost.materialCost.notes && (
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Notas:</span> {jobCost.materialCost.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deduction Notes */}
          {hasDeductions && payout.deductionNotes && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700">Notas de Deducao</h3>
              <div className="p-4 rounded-md border bg-red-50 text-sm text-slate-700">
                {payout.deductionNotes}
              </div>
            </div>
          )}

          {/* Payment Status */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700">Status de Pagamento</h3>
            <div className="space-y-2">
              {payout.SubcontractorPayment.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-md border bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <PaymentStatusBadge
                      status={payment.status}
                      amount={payment.amount}
                    />
                    <span className="text-sm text-slate-600 capitalize">{payment.paymentType}</span>
                    {payment.paidDate && (
                      <span className="text-sm text-slate-500">
                        Pago em {formatDate(payment.paidDate)}
                      </span>
                    )}
                  </div>
                  {payment.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsPaid(payment)}
                    >
                      Marcar como Pago
                    </Button>
                  )}
                </div>
              ))}

              {!hasPendingPayments && (
                <p className="text-sm text-green-600 font-medium">
                  Todos os pagamentos foram concluidos
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark Paid Dialog */}
      {selectedPayment && (
        <MarkPaidDialog
          open={markPaidDialogOpen}
          onOpenChange={setMarkPaidDialogOpen}
          paymentId={selectedPayment.id}
          subcontractorId={subcontractorId}
          amount={selectedPayment.amount}
          subcontractorName={subcontractorName}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}

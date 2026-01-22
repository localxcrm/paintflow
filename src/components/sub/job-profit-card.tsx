'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MaterialCostForm } from './material-cost-form';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubJobFinancial } from '@/types/sub-financial';

interface JobProfitCardProps {
  job: SubJobFinancial;
  onMaterialCostChange: (jobId: string, totalCost: number, notes?: string) => Promise<void>;
}

export function JobProfitCard({ job, onMaterialCostChange }: JobProfitCardProps) {
  const [isEditingMaterial, setIsEditingMaterial] = useState(false);

  // Determine payment status badge
  const statusConfig = {
    paid: { variant: 'default' as const, label: 'Pago', className: 'bg-green-500 hover:bg-green-600' },
    partial: { variant: 'default' as const, label: 'Parcial', className: 'bg-blue-500 hover:bg-blue-600' },
    pending: { variant: 'default' as const, label: 'Pendente', className: 'bg-amber-500 hover:bg-amber-600' },
  };

  const status = statusConfig[job.paymentStatus];

  const handleSaveMaterialCost = async (totalCost: number, notes?: string) => {
    await onMaterialCostChange(job.jobId, totalCost, notes);
    setIsEditingMaterial(false);
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{job.jobNumber}</h3>
            <Badge
              variant={job.profit < 0 ? 'destructive' : 'default'}
              className={job.profit >= 0 ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
            >
              {job.profitMargin.toFixed(1)}%
            </Badge>
          </div>

          <p className="text-sm text-slate-600 mb-2">{job.clientName}</p>
          <p className="text-xs text-slate-500 mb-4">{job.address}</p>

          {/* Payment status */}
          <Badge variant={status.variant} className={status.className}>
            {status.label}
          </Badge>

          {/* Profit formula breakdown */}
          <div className="space-y-2 text-sm mt-4">
            <div className="flex justify-between">
              <span className="text-slate-600">Ganho:</span>
              <span className="font-medium">${job.earnings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Mao de obra:</span>
              <span className="text-red-600">-${job.laborCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Materiais:</span>
              <span className="text-red-600">-${job.materialCost.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold">Lucro:</span>
              <div className="flex items-center gap-1">
                {job.profit < 0 && <AlertTriangle className="h-4 w-4 text-red-600" />}
                <span className={cn(
                  'text-lg font-bold',
                  job.profit < 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  ${job.profit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Effective rate for owner */}
          {job.ownerHours && job.ownerHours > 0 && job.effectiveRate && (
            <div className="mt-3 pt-3 border-t flex justify-between text-sm">
              <span className="text-purple-600">Taxa Efetiva:</span>
              <span className="font-semibold text-purple-600">
                ${job.effectiveRate.toFixed(2)}/h ({job.ownerHours.toFixed(1)}h)
              </span>
            </div>
          )}

          {/* Edit materials button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
            onClick={() => setIsEditingMaterial(true)}
          >
            Editar Materiais
          </Button>
        </CardContent>
      </Card>

      {/* Material cost edit dialog */}
      <Dialog open={isEditingMaterial} onOpenChange={setIsEditingMaterial}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custo de Materiais - {job.jobNumber}</DialogTitle>
          </DialogHeader>
          <MaterialCostForm
            jobId={job.jobId}
            currentCost={job.materialCost}
            currentNotes={null}
            onSave={handleSaveMaterialCost}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

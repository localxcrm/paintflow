'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, getProfitFlagColor } from '@/lib/utils/job-calculations';
import { JobTabProps } from './types';

export function JobFinancialsTab({ job }: JobTabProps) {
  const netAfterPayouts = job.grossProfit - job.salesCommissionAmount - job.pmCommissionAmount;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Revenue */}
      <div className="bg-slate-50 p-4 rounded-lg space-y-3">
        <h3 className="font-semibold">Receita</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Valor do Job</span>
            <span className="font-semibold">{formatCurrency(job.jobValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Depósito Requerido (30%)</span>
            <span>{formatCurrency(job.depositRequired)}</span>
          </div>
        </div>
      </div>

      {/* Costs */}
      <div className="bg-slate-50 p-4 rounded-lg space-y-3">
        <h3 className="font-semibold">Custos</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Materiais (15%)</span>
            <span>{formatCurrency(job.subMaterials)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Mão de Obra (45%)</span>
            <span>{formatCurrency(job.subLabor)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total Custo Sub (60%)</span>
            <span>{formatCurrency(job.subTotal)}</span>
          </div>
        </div>
      </div>

      {/* Profit Analysis */}
      <div className="bg-green-50 p-4 rounded-lg space-y-3 col-span-2">
        <h3 className="font-semibold text-green-800">Análise de Lucro</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-green-600">Lucro Bruto</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(job.grossProfit)}</p>
          </div>
          <div>
            <p className="text-sm text-green-600">Margem Bruta</p>
            <p className="text-2xl font-bold text-green-700">{job.grossMarginPct}%</p>
          </div>
          <div>
            <p className="text-sm text-green-600">Status</p>
            <Badge variant="outline" className={getProfitFlagColor(job.profitFlag)}>
              {job.profitFlag}
            </Badge>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <span className={job.meetsMinGp ? 'text-green-600' : 'text-red-600'}>
            {job.meetsMinGp ? '✓' : '✗'} Min GP ($900)
          </span>
          <span className={job.meetsTargetGm ? 'text-green-600' : 'text-red-600'}>
            {job.meetsTargetGm ? '✓' : '✗'} Target GM (40%)
          </span>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-blue-50 p-4 rounded-lg space-y-3 col-span-2">
        <h3 className="font-semibold text-blue-800">Resumo de Pagamentos</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-blue-600">Com. Vendas</p>
            <p className="font-semibold">{formatCurrency(job.salesCommissionAmount)}</p>
            <p className="text-xs text-blue-500">{job.salesCommissionPaid ? 'Pago' : 'Pendente'}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Com. PM</p>
            <p className="font-semibold">{formatCurrency(job.pmCommissionAmount)}</p>
            <p className="text-xs text-blue-500">{job.pmCommissionPaid ? 'Pago' : 'Pendente'}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Pag. Sub</p>
            <p className="font-semibold">{formatCurrency(job.subcontractorPrice)}</p>
            <p className="text-xs text-blue-500">{job.subcontractorPaid ? 'Pago' : 'Pendente'}</p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Líquido Após Pagamentos</p>
            <p className="font-semibold">{formatCurrency(netAfterPayouts)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

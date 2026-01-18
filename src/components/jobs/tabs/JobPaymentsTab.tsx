'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/job-calculations';
import { CreditCard, Percent, Calendar } from 'lucide-react';
import { JobTabProps } from './types';

export function JobPaymentsTab({ job, onFieldChange }: JobTabProps) {
  return (
    <div className="space-y-6">
      {/* Client Payments */}
      <div className="bg-slate-50 p-4 rounded-lg space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Pagamentos do Cliente
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Depósito Requerido</Label>
            <p className="text-lg font-semibold">{formatCurrency(job.depositRequired)}</p>
          </div>
          <div className="space-y-2">
            <Label>Saldo Devedor</Label>
            <p className="text-lg font-semibold text-orange-600">{formatCurrency(job.balanceDue)}</p>
          </div>
        </div>

        {/* Deposit Payment */}
        <div className="p-3 bg-white rounded border space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="depositPaid"
              checked={job.depositPaid}
              onCheckedChange={(checked) => onFieldChange('depositPaid', checked)}
            />
            <Label htmlFor="depositPaid" className="font-medium">Depósito Pago</Label>
          </div>
          {job.depositPaid && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select
                  value={job.depositPaymentMethod || ''}
                  onValueChange={(value) => onFieldChange('depositPaymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="check">Cheque</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={job.depositPaymentDate || ''}
                  onChange={(e) => onFieldChange('depositPaymentDate', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Job Payment */}
        <div className="p-3 bg-white rounded border space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="jobPaid"
              checked={job.jobPaid}
              onCheckedChange={(checked) => onFieldChange('jobPaid', checked)}
            />
            <Label htmlFor="jobPaid" className="font-medium">Trabalho Pago Total</Label>
          </div>
          {job.jobPaid && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select
                  value={job.jobPaymentMethod || ''}
                  onValueChange={(value) => onFieldChange('jobPaymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="check">Cheque</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={job.jobPaymentDate || ''}
                  onChange={(e) => onFieldChange('jobPaymentDate', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceDate">Data da Fatura</Label>
            <Input
              id="invoiceDate"
              type="date"
              value={job.invoiceDate || ''}
              onChange={(e) => onFieldChange('invoiceDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentReceivedDate">Pagamento Recebido</Label>
            <Input
              id="paymentReceivedDate"
              type="date"
              value={job.paymentReceivedDate || ''}
              onChange={(e) => onFieldChange('paymentReceivedDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Commission Payments */}
      <div className="bg-slate-50 p-4 rounded-lg space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Percent className="h-4 w-4" />
          Pagamento de Comissões
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <div>
              <p className="font-medium">Comissão de Vendas</p>
              <p className="text-sm text-slate-500">
                {job.salesRep?.name || 'Sem vendedor'} - {job.salesCommissionPct}%
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{formatCurrency(job.salesCommissionAmount)}</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="salesCommissionPaid"
                  checked={job.salesCommissionPaid}
                  onCheckedChange={(checked) => onFieldChange('salesCommissionPaid', checked)}
                />
                <Label htmlFor="salesCommissionPaid">Pago</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <div>
              <p className="font-medium">Comissão PM</p>
              <p className="text-sm text-slate-500">
                {job.projectManager?.name || 'Sem PM'} - {job.pmCommissionPct}%
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{formatCurrency(job.pmCommissionAmount)}</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pmCommissionPaid"
                  checked={job.pmCommissionPaid}
                  onCheckedChange={(checked) => onFieldChange('pmCommissionPaid', checked)}
                />
                <Label htmlFor="pmCommissionPaid">Pago</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded border">
            <div>
              <p className="font-medium">Pagamento Subcontratado</p>
              <p className="text-sm text-slate-500">
                {job.subcontractor?.name || 'Sem subcontratado'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{formatCurrency(job.subcontractorPrice)}</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="subcontractorPaid"
                  checked={job.subcontractorPaid}
                  onCheckedChange={(checked) => onFieldChange('subcontractorPaid', checked)}
                />
                <Label htmlFor="subcontractorPaid">Pago</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-slate-50 p-4 rounded-lg space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Histórico de Pagamentos
        </h3>
        {job.paymentHistory && job.paymentHistory.length > 0 ? (
          <div className="space-y-2">
            {job.paymentHistory.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-2 bg-white rounded border text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    payment.type === 'deposit' ? 'bg-blue-500' :
                    payment.type === 'final_payment' ? 'bg-green-500' :
                    payment.type === 'sales_commission' ? 'bg-purple-500' :
                    payment.type === 'pm_commission' ? 'bg-orange-500' :
                    'bg-slate-500'
                  }`} />
                  <div>
                    <p className="font-medium">
                      {payment.type === 'deposit' ? 'Depósito' :
                       payment.type === 'final_payment' ? 'Pagamento Final' :
                       payment.type === 'sales_commission' ? 'Com. Vendas' :
                       payment.type === 'pm_commission' ? 'Com. PM' :
                       'Subcontratado'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {payment.method === 'cash' ? 'Dinheiro' :
                       payment.method === 'check' ? 'Cheque' :
                       payment.method === 'venmo' ? 'Venmo' :
                       payment.method === 'zelle' ? 'Zelle' :
                       payment.method === 'credit_card' ? 'Cartão' :
                       payment.method === 'bank_transfer' ? 'Transf.' :
                       'Outro'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                  <p className="text-slate-500 text-xs">{payment.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhum pagamento registrado ainda
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/job-calculations';
import { Users } from 'lucide-react';
import { JobTeamTabProps } from './types';

export function JobTeamTab({
  job,
  onFieldChange,
  teamMembers,
  subcontractors,
}: JobTeamTabProps) {
  const salesReps = teamMembers.filter(m => m.role === 'sales' || m.role === 'both');
  const pms = teamMembers.filter(m => m.role === 'pm' || m.role === 'both');

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Sales Rep */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Representante de Vendas
        </Label>
        <Select
          value={job.salesRepId || ''}
          onValueChange={(value) => onFieldChange('salesRepId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o vendedor" />
          </SelectTrigger>
          <SelectContent>
            {salesReps.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} ({member.defaultCommissionPct}%)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="salesCommissionPct" className="text-sm text-slate-500">
              Comissão %
            </Label>
            <Input
              id="salesCommissionPct"
              type="number"
              className="w-20"
              value={job.salesCommissionPct}
              onChange={(e) => onFieldChange('salesCommissionPct', parseFloat(e.target.value) || 0)}
            />
          </div>
          <span className="text-sm text-slate-600">
            = {formatCurrency(job.salesCommissionAmount)}
          </span>
        </div>
      </div>

      <Separator />

      {/* Project Manager */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Gerente de Projeto
        </Label>
        <Select
          value={job.projectManagerId || ''}
          onValueChange={(value) => onFieldChange('projectManagerId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o gerente" />
          </SelectTrigger>
          <SelectContent>
            {pms.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} ({member.defaultCommissionPct}%)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="pmCommissionPct" className="text-sm text-slate-500">
              Comissão %
            </Label>
            <Input
              id="pmCommissionPct"
              type="number"
              className="w-20"
              value={job.pmCommissionPct}
              onChange={(e) => onFieldChange('pmCommissionPct', parseFloat(e.target.value) || 0)}
            />
          </div>
          <span className="text-sm text-slate-600">
            = {formatCurrency(job.pmCommissionAmount)}
          </span>
        </div>
      </div>

      <Separator />

      {/* Subcontractor */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Subcontratado
        </Label>
        <Select
          value={job.subcontractorId || ''}
          onValueChange={(value) => onFieldChange('subcontractorId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o subcontratado" />
          </SelectTrigger>
          <SelectContent>
            {subcontractors.map((sub) => (
              <SelectItem key={sub.id} value={sub.id}>
                {sub.name} - {sub.companyName} ({sub.defaultPayoutPct}%)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-slate-500">Pagamento:</span>
          <span className="text-sm font-medium">
            {formatCurrency(job.subcontractorPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}

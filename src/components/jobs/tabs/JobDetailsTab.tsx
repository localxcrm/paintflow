'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { JobStatus, ProjectType } from '@/types';
import { JOB_STATUS_LABELS, PROJECT_TYPE_LABELS } from '@/lib/constants';
import { User, Calendar, MapPin, Building, FileText } from 'lucide-react';
import { JobTabProps } from './types';

export function JobDetailsTab({ job, onFieldChange }: JobTabProps) {
  return (
    <div className="space-y-6">
      {/* Client Info */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Informações do Cliente
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nome do Cliente</Label>
            <Input
              value={job.clientName || ''}
              onChange={(e) => onFieldChange('clientName', e.target.value)}
            />
          </div>
          <div>
            <Label>Número do Job</Label>
            <Input value={job.jobNumber || ''} disabled />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Endereço
        </h4>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Endereço</Label>
            <Input
              value={job.address || ''}
              onChange={(e) => onFieldChange('address', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Cidade</Label>
              <Input
                value={job.city || ''}
                onChange={(e) => onFieldChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Input
                value={job.state || ''}
                onChange={(e) => onFieldChange('state', e.target.value)}
              />
            </div>
            <div>
              <Label>CEP</Label>
              <Input
                value={job.zipCode || ''}
                onChange={(e) => onFieldChange('zipCode', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Job Info */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Building className="h-4 w-4" />
          Informações do Job
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Select
              value={job.status}
              onValueChange={(value) => onFieldChange('status', value as JobStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de Projeto</Label>
            <Select
              value={job.projectType}
              onValueChange={(value) => onFieldChange('projectType', value as ProjectType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Datas
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Data do Job</Label>
            <Input
              type="date"
              value={job.jobDate ? new Date(job.jobDate).toISOString().split('T')[0] : ''}
              onChange={(e) => onFieldChange('jobDate', e.target.value)}
            />
          </div>
          <div>
            <Label>Início Programado</Label>
            <Input
              type="date"
              value={job.scheduledStartDate ? new Date(job.scheduledStartDate).toISOString().split('T')[0] : ''}
              onChange={(e) => onFieldChange('scheduledStartDate', e.target.value || null)}
            />
          </div>
          <div>
            <Label>Fim Programado</Label>
            <Input
              type="date"
              value={job.scheduledEndDate ? new Date(job.scheduledEndDate).toISOString().split('T')[0] : ''}
              onChange={(e) => onFieldChange('scheduledEndDate', e.target.value || null)}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Notas
        </h4>
        <Textarea
          value={job.notes || ''}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          placeholder="Adicione notas sobre este job..."
          rows={4}
        />
      </div>
    </div>
  );
}

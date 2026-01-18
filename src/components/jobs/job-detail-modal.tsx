'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Job, JobStatus, TeamMember, Subcontractor } from '@/types';
import { getStatusColor, getProfitFlagColor } from '@/lib/utils/job-calculations';
import { JOB_STATUS_LABELS } from '@/lib/constants';
import { Save, X } from 'lucide-react';
import {
  JobDetailsTab,
  JobTeamTab,
  JobPaymentsTab,
  JobMediaTab,
  JobFinancialsTab,
} from './tabs';

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedJob: Job) => void;
  teamMembers: TeamMember[];
  subcontractors: Subcontractor[];
}

export function JobDetailModal({
  job,
  isOpen,
  onClose,
  onSave,
  teamMembers,
  subcontractors,
}: JobDetailModalProps) {
  const [editedJob, setEditedJob] = useState<Job | null>(null);

  useEffect(() => {
    if (job) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditedJob({ ...job });
    }
  }, [job]);

  if (!editedJob) return null;

  const handleFieldChange = (field: keyof Job, value: unknown) => {
    setEditedJob(prev => {
      if (!prev) return prev;

      const updated = { ...prev, [field]: value };

      // Recalculate dependent fields
      if (field === 'jobValue') {
        const jobValue = value as number;
        updated.subMaterials = jobValue * 0.15;
        updated.subLabor = jobValue * 0.45;
        updated.subTotal = jobValue * 0.60;
        updated.grossProfit = jobValue * 0.40;
        updated.grossMarginPct = 40;
        updated.depositRequired = jobValue * 0.30;
        updated.salesCommissionAmount = jobValue * (updated.salesCommissionPct / 100);
        updated.pmCommissionAmount = jobValue * (updated.pmCommissionPct / 100);
        updated.subcontractorPrice = jobValue * 0.60;
        updated.balanceDue = jobValue - (updated.depositPaid ? updated.depositRequired : 0);
        updated.meetsMinGp = updated.grossProfit >= 900;
        updated.profitFlag = updated.grossProfit < 900 ? 'RAISE PRICE' : 'OK';
      }

      if (field === 'salesCommissionPct') {
        updated.salesCommissionAmount = updated.jobValue * ((value as number) / 100);
      }

      if (field === 'pmCommissionPct') {
        updated.pmCommissionAmount = updated.jobValue * ((value as number) / 100);
      }

      if (field === 'depositPaid') {
        updated.balanceDue = updated.jobPaid ? 0 : updated.jobValue - ((value as boolean) ? updated.depositRequired : 0);
      }

      if (field === 'jobPaid') {
        updated.balanceDue = (value as boolean) ? 0 : updated.jobValue - (updated.depositPaid ? updated.depositRequired : 0);
      }

      if (field === 'salesRepId') {
        const member = teamMembers.find(m => m.id === value);
        updated.salesRep = member;
        if (member) {
          updated.salesCommissionPct = member.defaultCommissionPct;
          updated.salesCommissionAmount = updated.jobValue * (member.defaultCommissionPct / 100);
        }
      }

      if (field === 'projectManagerId') {
        const member = teamMembers.find(m => m.id === value);
        updated.projectManager = member;
        if (member) {
          updated.pmCommissionPct = member.defaultCommissionPct;
          updated.pmCommissionAmount = updated.jobValue * (member.defaultCommissionPct / 100);
        }
      }

      if (field === 'subcontractorId') {
        const sub = subcontractors.find(s => s.id === value);
        updated.subcontractor = sub;
        if (sub) {
          updated.subcontractorPrice = updated.jobValue * (sub.defaultPayoutPct / 100);
        }
      }

      return updated;
    });
  };

  const handleSave = () => {
    if (editedJob) {
      onSave(editedJob);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                {editedJob.clientName}
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">{editedJob.jobNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(editedJob.status)}>
                {JOB_STATUS_LABELS[editedJob.status]}
              </Badge>
              <Badge variant="outline" className={getProfitFlagColor(editedJob.profitFlag)}>
                {editedJob.profitFlag}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="media">Mídia</TabsTrigger>
            <TabsTrigger value="financials">Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <JobDetailsTab job={editedJob} onFieldChange={handleFieldChange} />
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <JobTeamTab
              job={editedJob}
              onFieldChange={handleFieldChange}
              teamMembers={teamMembers}
              subcontractors={subcontractors}
            />
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <JobPaymentsTab job={editedJob} onFieldChange={handleFieldChange} />
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            <JobMediaTab
              job={editedJob}
              onFieldChange={handleFieldChange}
              onPhotosChange={(photos) => handleFieldChange('photos', photos)}
            />
          </TabsContent>

          <TabsContent value="financials" className="mt-4">
            <JobFinancialsTab job={editedJob} onFieldChange={handleFieldChange} />
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

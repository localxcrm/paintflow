'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Subcontractor {
  id: string;
  name: string;
  color: string;
  hasConflict?: boolean;
  conflictJob?: string;
}

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  scheduledDate: string;
  jobNumber: string;
  currentAssignments: string[];
  onAssign: (subcontractorIds: string[]) => Promise<void>;
}

/**
 * Dialog for assigning subcontractors to a scheduled job
 */
export function AssignDialog({
  open,
  onOpenChange,
  scheduleId,
  scheduledDate,
  jobNumber,
  currentAssignments,
  onAssign,
}: AssignDialogProps) {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(currentAssignments);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch subcontractors and check conflicts
  useEffect(() => {
    if (!open) return;

    async function fetchData() {
      setLoading(true);
      try {
        // Fetch all active subcontractors
        const subsRes = await fetch('/api/subcontractors?active=true');
        const subsData = await subsRes.json();

        // Check for conflicts
        const subs: Subcontractor[] = (subsData.subcontractors || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          color: sub.color || '#3b82f6',
        }));

        // Check conflicts for each sub
        for (const sub of subs) {
          const conflictRes = await fetch('/api/schedules/conflicts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subcontractorId: sub.id, date: scheduledDate }),
          });
          const conflictData = await conflictRes.json();
          
          if (conflictData.hasConflict) {
            sub.hasConflict = true;
            sub.conflictJob = conflictData.conflictingJobs[0]?.jobNumber;
          }
        }

        setSubcontractors(subs);
        setSelectedIds(currentAssignments);
      } catch (error) {
        console.error('Error fetching subcontractors:', error);
        toast.error('Erro ao carregar subcontratados');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [open, scheduledDate, currentAssignments]);

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onAssign(selectedIds);
      toast.success('Atribuições salvas!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast.error('Erro ao salvar atribuições');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir Subcontratados</DialogTitle>
          <DialogDescription>
            Selecione os subcontratados para o trabalho {jobNumber} em {scheduledDate}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-auto py-4">
            {subcontractors.map((sub) => (
              <label
                key={sub.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.includes(sub.id)}
                  onCheckedChange={() => handleToggle(sub.id)}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: sub.color }}
                />
                <span className="flex-1 font-medium text-slate-900">{sub.name}</span>
                {sub.hasConflict && (
                  <div className="flex items-center gap-1 text-amber-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Em {sub.conflictJob}</span>
                  </div>
                )}
              </label>
            ))}

            {subcontractors.length === 0 && (
              <p className="text-center text-slate-500 py-4">
                Nenhum subcontratado disponível
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface MaterialCostFormProps {
  jobId: string;
  currentCost: number | null;
  currentNotes: string | null;
  onSave: (totalCost: number, notes?: string) => Promise<void>;
}

export function MaterialCostForm({
  jobId,
  currentCost,
  currentNotes,
  onSave,
}: MaterialCostFormProps) {
  const [cost, setCost] = useState(currentCost?.toString() || '0');
  const [notes, setNotes] = useState(currentNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const costValue = parseFloat(cost);
    if (isNaN(costValue) || costValue < 0) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(costValue, notes || undefined);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`cost-${jobId}`}>Custo de Materiais</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            $
          </span>
          <Input
            id={`cost-${jobId}`}
            type="number"
            step="0.01"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="pl-7"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`notes-${jobId}`}>Observacoes (opcional)</Label>
        <textarea
          id={`notes-${jobId}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Ex: Tintas, pinceis, lona..."
        />
      </div>

      <Button type="submit" disabled={isSaving} className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          'Salvar'
        )}
      </Button>
    </form>
  );
}

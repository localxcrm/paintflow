'use client';

import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { SubcontractorEarningsTable } from '@/components/financial/subcontractor-earnings-table';
import { fetchSubcontractorFinancials } from '@/lib/api/financial';
import type { SubcontractorFinancialSummary } from '@/types/financial';

export default function FinanceiroPage() {
  const [data, setData] = useState<SubcontractorFinancialSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const response = await fetchSubcontractorFinancials();
      setData(response.subcontractors);
    } catch (error) {
      console.error('Failed to load subcontractor financials:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Financeiro - Subempreiteiros</h1>
        <p className="text-sm text-slate-500">
          Visualize e gerencie pagamentos de subempreiteiros
        </p>
      </div>

      {/* Table */}
      <SubcontractorEarningsTable data={data} isLoading={loading} />
    </div>
  );
}

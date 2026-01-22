'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { CostBreakdownCard } from '@/components/financial/cost-breakdown-card';
import { fetchSubcontractorFinancialDetail } from '@/lib/api/financial';
import type { SubcontractorFinancialDetail, JobCostDetail } from '@/types/financial';

export default function SubcontractorFinancialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subcontractorId = params.id as string;

  const [data, setData] = useState<SubcontractorFinancialDetail | null>(null);
  const [jobCosts, setJobCosts] = useState<Record<string, JobCostDetail>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const response = await fetchSubcontractorFinancialDetail(subcontractorId);
      setData(response.subcontractor);
      setJobCosts(response.jobCosts);
    } catch (error) {
      console.error('Failed to load subcontractor financial detail:', error);
      toast.error('Erro ao carregar detalhes financeiros');
    } finally {
      setLoading(false);
    }
  }, [subcontractorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Subempreiteiro não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Button
        variant="ghost"
        onClick={() => router.push('/financeiro')}
        className="gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar para Financeiro
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">{data.name}</h1>
        {data.companyName && (
          <p className="text-lg text-slate-600">{data.companyName}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">Total Ganho</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.totalEarnings)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">Pago</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.totalPaid)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-slate-500 mb-1">Pendente</div>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(data.pendingAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Cost Breakdown Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Detalhes por Job</h2>
        {data.payouts.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            Nenhum pagamento encontrado
          </p>
        ) : (
          data.payouts.map((payout) => (
            <CostBreakdownCard
              key={payout.id}
              payout={payout}
              jobCost={jobCosts[payout.jobId] || null}
              subcontractorId={subcontractorId}
              subcontractorName={data.name}
              onPaymentSuccess={loadData}
            />
          ))
        )}
      </div>
    </div>
  );
}

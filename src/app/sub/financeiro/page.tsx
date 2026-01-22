'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { EarningsSummary } from '@/components/sub/earnings-summary';
import { JobProfitCard } from '@/components/sub/job-profit-card';
import { RefreshCw, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SubEarningsSummary, SubJobFinancial } from '@/types/sub-financial';

type Period = 'all' | 'month' | 'week';

export default function FinanceiroPage() {
  const [summary, setSummary] = useState<SubEarningsSummary | null>(null);
  const [jobs, setJobs] = useState<SubJobFinancial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('all');

  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetch('/api/sub/financials');

      if (!res.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const data = await res.json();
      setSummary(data.summary);
      setJobs(data.jobs || []);

      if (showRefreshIndicator) {
        toast.success('Atualizado!');
      }
    } catch (error) {
      console.error('Error loading financials:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter jobs by period
  const filteredJobs = useMemo(() => {
    if (period === 'all') {
      return jobs;
    }

    const now = new Date();
    const cutoffDate = new Date();

    if (period === 'week') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      cutoffDate.setMonth(now.getMonth() - 1);
    }

    return jobs.filter((job) => {
      if (!job.completedDate) return false;
      const jobDate = new Date(job.completedDate);
      return jobDate >= cutoffDate;
    });
  }, [jobs, period]);

  const handleMaterialCostChange = async (
    jobId: string,
    totalCost: number,
    notes?: string
  ) => {
    try {
      const res = await fetch(`/api/sub/material-costs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ totalCost, notes }),
      });

      if (!res.ok) {
        throw new Error('Erro ao salvar');
      }

      toast.success('Custo atualizado!');
      // Refresh data to recalculate profit
      await loadData();
    } catch (error) {
      console.error('Error updating material cost:', error);
      toast.error('Erro ao atualizar custo');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Gradient header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className={cn('h-5 w-5', isRefreshing && 'animate-spin')} />
          </Button>
        </div>

        {/* Earnings summary component */}
        {summary && <EarningsSummary summary={summary} />}
      </header>

      {/* Filter controls - rounded top corners */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 -mt-4 pt-4 pb-3 rounded-t-3xl shadow-sm">
        <div className="flex gap-2">
          <Button
            variant={period === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('all')}
          >
            Todos
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('month')}
          >
            Este Mes
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('week')}
          >
            Esta Semana
          </Button>
        </div>
      </div>

      {/* Job list */}
      <div className="p-4 space-y-4">
        {filteredJobs.map((job) => (
          <JobProfitCard
            key={job.jobId}
            job={job}
            onMaterialCostChange={handleMaterialCostChange}
          />
        ))}

        {filteredJobs.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>Nenhum trabalho encontrado</p>
            {period !== 'all' && (
              <Button
                variant="link"
                onClick={() => setPeriod('all')}
                className="mt-2"
              >
                Ver todos os trabalhos
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

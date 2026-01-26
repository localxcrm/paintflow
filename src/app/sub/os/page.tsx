'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Loader2,
  DollarSign,
  Calendar,
  ChevronRight,
  FileText,
  RefreshCw,
  Play,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WorkOrder {
  id: string;
  osNumber: string;
  status: string;
  publicToken: string;
}

interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  address: string;
  city: string;
  status: string;
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  subcontractorPrice: number;
  workOrder: WorkOrder | null;
  progress: number;
}

export default function SubOSListPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadJobs = useCallback(async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const res = await fetch('/api/sub/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        if (showRefreshToast) {
          toast.success('Atualizado!');
        }
      } else {
        toast.error('Erro ao carregar OS');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Erro ao carregar OS');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  // Separate jobs by status
  const inProgressJobs = jobs.filter(j => j.progress > 0 && j.progress < 100);
  const scheduledJobs = jobs.filter(j => j.progress === 0);
  const completedJobs = jobs.filter(j => j.progress === 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F2F2F7]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
          <p className="text-slate-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-20">
      {/* Header */}
      <header className="bg-white px-4 pt-6 pb-4 safe-area-top border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
              Ordens de Serviço
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {jobs.length} trabalho{jobs.length !== 1 ? 's' : ''} no total
            </p>
          </div>
          <button
            onClick={() => loadJobs(true)}
            disabled={isRefreshing}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <RefreshCw className={cn("h-5 w-5 text-slate-600", isRefreshing && "animate-spin")} />
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-1.5">
              <Play className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-slate-900">{inProgressJobs.length}</p>
            <p className="text-[11px] text-slate-500">Em Andamento</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-1.5">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-xl font-bold text-slate-900">{scheduledJobs.length}</p>
            <p className="text-[11px] text-slate-500">Agendados</p>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xl font-bold text-slate-900">{completedJobs.length}</p>
            <p className="text-[11px] text-slate-500">Concluídos</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* In Progress */}
        {inProgressJobs.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              Em Andamento
            </p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
              {inProgressJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => {
                    if (job.workOrder) {
                      router.push(`/sub/os/${job.workOrder.id}`);
                    }
                  }}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </section>
        )}

        {/* Scheduled */}
        {scheduledJobs.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              Agendados
            </p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
              {scheduledJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => {
                    if (job.workOrder) {
                      router.push(`/sub/os/${job.workOrder.id}`);
                    }
                  }}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completedJobs.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              Concluídos
            </p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
              {completedJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={() => {
                    if (job.workOrder) {
                      router.push(`/sub/os/${job.workOrder.id}`);
                    }
                  }}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {jobs.length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Nenhuma OS encontrada
            </h3>
            <p className="text-slate-500 text-sm">
              Quando você receber trabalhos, eles aparecerão aqui
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface JobCardProps {
  job: Job;
  onClick: () => void;
  formatCurrency: (value: number) => string;
  formatDate: (date: string | null) => string;
}

function JobCard({ job, onClick, formatCurrency, formatDate }: JobCardProps) {
  const getStatusInfo = (progress: number) => {
    if (progress === 100) {
      return { label: 'Concluído', color: 'bg-green-100 text-green-700' };
    }
    if (progress > 0) {
      return { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' };
    }
    return { label: 'Agendado', color: 'bg-amber-100 text-amber-700' };
  };

  const statusInfo = getStatusInfo(job.progress);

  return (
    <div
      className="p-4 active:bg-slate-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Progress Circle */}
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className="stroke-slate-100"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className={cn(
                "transition-all duration-500",
                job.progress === 100 ? "stroke-green-500" : job.progress > 0 ? "stroke-blue-500" : "stroke-amber-400"
              )}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${job.progress} 100`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
            {job.progress}%
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {job.workOrder?.osNumber || job.jobNumber}
            </span>
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", statusInfo.color)}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-start gap-1.5 mb-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-slate-900 text-sm truncate">
                {job.address}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {job.city} • {job.clientName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(job.scheduledStartDate)}</span>
            </div>
            <div className="flex items-center gap-1 text-green-600 font-semibold">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{formatCurrency(job.subcontractorPrice || 0)}</span>
            </div>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-slate-300 shrink-0 self-center" />
      </div>
    </div>
  );
}

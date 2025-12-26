'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Loader2,
  DollarSign,
  Calendar,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

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

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/sub/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      } else {
        toast.error('Erro ao carregar OS');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Erro ao carregar OS');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getStatusBadge = (status: string, progress: number) => {
    if (progress === 100) {
      return <Badge className="bg-green-100 text-green-700">Concluído</Badge>;
    }
    if (progress > 0) {
      return <Badge className="bg-blue-100 text-blue-700">Em Andamento</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700">Agendado</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Separate jobs by status
  const inProgressJobs = jobs.filter(j => j.progress > 0 && j.progress < 100);
  const scheduledJobs = jobs.filter(j => j.progress === 0);
  const completedJobs = jobs.filter(j => j.progress === 100);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 safe-area-top">
        <h1 className="text-lg font-semibold text-slate-900">
          Ordens de Serviço
        </h1>
        <p className="text-sm text-slate-500">
          {jobs.length} OS no total
        </p>
      </header>

      <div className="p-4 space-y-6">
        {/* In Progress */}
        {inProgressJobs.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
              Em Andamento ({inProgressJobs.length})
            </h2>
            <div className="space-y-3">
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
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          </section>
        )}

        {/* Scheduled */}
        {scheduledJobs.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
              Agendados ({scheduledJobs.length})
            </h2>
            <div className="space-y-3">
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
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completedJobs.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1">
              Concluídos ({completedJobs.length})
            </h2>
            <div className="space-y-3">
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
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {jobs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-medium text-slate-900 mb-1">
                Nenhuma OS encontrada
              </h3>
              <p className="text-sm text-slate-500">
                Quando você receber trabalhos, eles aparecerão aqui
              </p>
            </CardContent>
          </Card>
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
  getStatusBadge: (status: string, progress: number) => React.ReactNode;
}

function JobCard({ job, onClick, formatCurrency, formatDate, getStatusBadge }: JobCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="shrink-0 font-mono text-xs">
                {job.workOrder?.osNumber || job.jobNumber}
              </Badge>
              {getStatusBadge(job.status, job.progress)}
            </div>
            <div className="flex items-start gap-2 mt-2">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {job.address}
                </p>
                <p className="text-sm text-slate-500">
                  {job.city} • {job.clientName}
                </p>
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
        </div>

        {/* Date and Price Row */}
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(job.scheduledStartDate)}</span>
            {job.scheduledEndDate && job.scheduledEndDate !== job.scheduledStartDate && (
              <span>- {formatDate(job.scheduledEndDate)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-green-600 font-medium">
            <DollarSign className="h-4 w-4" />
            <span>{formatCurrency(job.subcontractorPrice || 0)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <Progress value={job.progress} className="h-2 flex-1" />
          <span className="text-xs text-slate-500 w-10 text-right">
            {job.progress}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

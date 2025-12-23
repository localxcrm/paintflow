'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Filter, RefreshCw } from 'lucide-react';

// Dynamically import the map component to avoid SSR issues
const JobMap = dynamic(() => import('@/components/map/job-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-slate-100 rounded-lg flex items-center justify-center">
      <div className="text-slate-500">Carregando mapa...</div>
    </div>
  ),
});

interface Subcontractor {
  id: string;
  name: string;
  color: string;
}

interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  address: string;
  city: string;
  state: string | null;
  status: string;
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  latitude: number | null;
  longitude: number | null;
  jobValue: number;
  Subcontractor: Subcontractor | null;
}

type PeriodFilter = 'all' | 'this_week' | 'this_month' | 'next_month';
type StatusFilter = 'all' | 'scheduled' | 'got_the_job' | 'completed';

export default function MapaPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [jobsRes, subsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/subcontractors')
      ]);

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs || []);
      }

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubcontractors(subsData.subcontractors || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    // Status filter
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;

    // Subcontractor filter
    if (selectedSubcontractor !== 'all' && job.Subcontractor?.id !== selectedSubcontractor) return false;

    // Period filter
    if (periodFilter !== 'all' && job.scheduledStartDate) {
      const jobDate = new Date(job.scheduledStartDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (periodFilter === 'this_week') {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        if (jobDate < today || jobDate > endOfWeek) return false;
      } else if (periodFilter === 'this_month') {
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        if (jobDate < today || jobDate > endOfMonth) return false;
      } else if (periodFilter === 'next_month') {
        const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        if (jobDate < startOfNextMonth || jobDate > endOfNextMonth) return false;
      }
    }

    return true;
  });

  // Jobs with coordinates
  const jobsWithCoords = filteredJobs.filter(job => job.latitude && job.longitude);

  // Stats
  const statusCounts = {
    scheduled: filteredJobs.filter(j => j.status === 'scheduled').length,
    got_the_job: filteredJobs.filter(j => j.status === 'got_the_job').length,
    completed: filteredJobs.filter(j => j.status === 'completed').length,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalValue = filteredJobs.reduce((sum, job) => sum + job.jobValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            Mapa de Trabalhos
          </h1>
          <p className="text-slate-500">Visualize a localização dos trabalhos</p>
        </div>

        <Button variant="outline" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <label className="text-xs text-slate-500 mb-1 block">Período</label>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="this_week">Esta Semana</SelectItem>
                  <SelectItem value="this_month">Este Mês</SelectItem>
                  <SelectItem value="next_month">Próximo Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <label className="text-xs text-slate-500 mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="got_the_job">Confirmado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <label className="text-xs text-slate-500 mb-1 block">Equipe</label>
              <Select value={selectedSubcontractor} onValueChange={setSelectedSubcontractor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {subcontractors.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <JobMap jobs={jobsWithCoords} />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-slate-500">Jobs no Mapa</div>
            <div className="text-2xl font-bold">{jobsWithCoords.length}</div>
            <div className="text-xs text-slate-400">de {filteredJobs.length} total</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-slate-500">Agendados</div>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.scheduled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-slate-500">Confirmados</div>
            <div className="text-2xl font-bold text-green-600">{statusCounts.got_the_job}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-slate-500">Valor Total</div>
            <div className="text-xl font-bold text-emerald-600">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Legenda - Equipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {subcontractors.map(sub => (
              <div key={sub.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${sub.color || 'bg-gray-500'}`} />
                <span className="text-sm">{sub.name}</span>
              </div>
            ))}
            {subcontractors.length === 0 && (
              <span className="text-sm text-slate-500">Nenhum subcontratado cadastrado</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jobs without coordinates warning */}
      {filteredJobs.length > jobsWithCoords.length && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800">
                  {filteredJobs.length - jobsWithCoords.length} trabalhos sem coordenadas
                </div>
                <div className="text-sm text-yellow-700">
                  Adicione latitude e longitude aos trabalhos para visualizá-los no mapa.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, List, Calendar, MapPin, RefreshCw, Briefcase, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { JobListView } from '@/components/sub/job-list-view';
import { CalendarView } from '@/components/sub/calendar-view';
import { MapView } from '@/components/sub/map-view';

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

interface SubUser {
  id: string;
  name: string;
  email: string;
}

type TabType = 'list' | 'calendar' | 'map';

const tabs = [
  { id: 'list' as TabType, label: 'Lista', icon: List },
  { id: 'calendar' as TabType, label: 'Calendario', icon: Calendar },
  { id: 'map' as TabType, label: 'Mapa', icon: MapPin },
];

export default function SubDashboardPage() {
  const [user, setUser] = useState<SubUser | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('list');

  const loadData = useCallback(async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [meRes, jobsRes] = await Promise.all([
        fetch('/api/sub/me'),
        fetch('/api/sub/jobs')
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs || []);
      }

      if (showRefreshToast) {
        toast.success('Atualizado!');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  // Stats calculations
  const todayJobs = jobs.filter(j => {
    if (!j.scheduledStartDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jobDate = new Date(j.scheduledStartDate);
    jobDate.setHours(0, 0, 0, 0);
    return jobDate.getTime() === today.getTime();
  }).length;

  const avgProgress = Math.round(jobs.reduce((acc, j) => acc + j.progress, 0) / (jobs.length || 1));

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
            <p className="text-slate-500 text-sm">{getGreeting()}</p>
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
              {user?.name?.split(' ')[0] || 'Pintor'}
            </h1>
            <p className="text-slate-400 text-sm capitalize mt-0.5">
              {getTodayDate()}
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <RefreshCw className={cn("h-5 w-5 text-slate-600", isRefreshing && "animate-spin")} />
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          {/* Total Jobs */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Trabalhos</p>
          </div>

          {/* Today */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{todayJobs}</p>
            <p className="text-xs text-slate-500 mt-0.5">Hoje</p>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{avgProgress}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Progresso</p>
          </div>
        </div>
      </div>

      {/* iOS-style Segmented Control */}
      <div className="px-4 pb-3">
        <div className="bg-slate-200/60 p-1 rounded-xl flex">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {activeTab === 'list' && <JobListView jobs={jobs} />}
          {activeTab === 'calendar' && <CalendarView jobs={jobs} />}
          {activeTab === 'map' && <MapView jobs={jobs} />}
        </div>
      </div>
    </div>
  );
}

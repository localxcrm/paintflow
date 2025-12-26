'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, List, Calendar, MapPin, LogOut, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { JobListView } from '@/components/sub/job-list-view';
import { CalendarView } from '@/components/sub/calendar-view';
import { MapView } from '@/components/sub/map-view';
import { Button } from '@/components/ui/button';

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
  const router = useRouter();
  const [user, setUser] = useState<SubUser | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Get user info
      const meRes = await fetch('/api/sub/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      // Get jobs
      const jobsRes = await fetch('/api/sub/jobs');
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
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/sub/me', { method: 'DELETE' });
      router.push('/sub/login');
    } catch {
      toast.error('Erro ao sair');
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 pt-6 pb-8 safe-area-top">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-100 text-sm">{getGreeting()}</p>
            <h1 className="text-2xl font-bold mt-0.5">
              {user?.name?.split(' ')[0] || 'Pintor'}!
            </h1>
            <p className="text-blue-200 text-sm mt-1 capitalize">
              {getTodayDate()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="text-white hover:bg-blue-500/50"
            >
              <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white hover:bg-blue-500/50"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-4 mt-4 bg-white/10 rounded-xl p-3">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">{jobs.length}</p>
            <p className="text-xs text-blue-200">Trabalhos</p>
          </div>
          <div className="w-px h-8 bg-blue-400/30" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">
              {jobs.filter(j => {
                if (!j.scheduledStartDate) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const jobDate = new Date(j.scheduledStartDate);
                jobDate.setHours(0, 0, 0, 0);
                return jobDate.getTime() === today.getTime();
              }).length}
            </p>
            <p className="text-xs text-blue-200">Hoje</p>
          </div>
          <div className="w-px h-8 bg-blue-400/30" />
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">
              {Math.round(jobs.reduce((acc, j) => acc + j.progress, 0) / (jobs.length || 1))}%
            </p>
            <p className="text-xs text-blue-200">Progresso</p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 -mt-4 pt-4 rounded-t-3xl">
        <div className="flex gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
      <div className="p-4">
        {activeTab === 'list' && <JobListView jobs={jobs} />}
        {activeTab === 'calendar' && <CalendarView jobs={jobs} />}
        {activeTab === 'map' && <MapView jobs={jobs} />}
      </div>
    </div>
  );
}

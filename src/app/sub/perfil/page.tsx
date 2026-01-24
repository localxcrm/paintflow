'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  LogOut,
  Loader2,
  DollarSign,
  Briefcase,
  Star,
  TrendingUp,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPhoneUS } from '@/lib/utils/phone';

interface SubUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Job {
  id: string;
  progress: number;
  subcontractorPrice: number;
  scheduledStartDate: string | null;
}

interface MonthlyStats {
  month: string;
  earnings: number;
  jobs: number;
}

export default function SubPerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<SubUser | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Get user info
      const meRes = await fetch('/api/sub/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      // Get jobs for stats
      const jobsRes = await fetch('/api/sub/jobs');
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/sub/me', { method: 'DELETE' });
      router.push('/sub/login');
    } catch {
      toast.error('Erro ao sair');
      setIsLoggingOut(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate stats
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.progress === 100).length;
  const totalEarnings = jobs
    .filter(j => j.progress === 100)
    .reduce((sum, j) => sum + (j.subcontractorPrice || 0), 0);

  // Calculate monthly stats
  const getMonthlyStats = (): MonthlyStats[] => {
    const monthlyData: Record<string, { earnings: number; jobs: number }> = {};
    const now = new Date();

    // Initialize last 4 months
    for (let i = 0; i < 4; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = { earnings: 0, jobs: 0 };
    }

    // Fill with job data
    jobs
      .filter(j => j.progress === 100 && j.scheduledStartDate)
      .forEach(job => {
        const date = new Date(job.scheduledStartDate!);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          monthlyData[key].earnings += job.subcontractorPrice || 0;
          monthlyData[key].jobs += 1;
        }
      });

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    return Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, data]) => {
        const monthIndex = parseInt(key.split('-')[1]) - 1;
        return {
          month: months[monthIndex],
          earnings: data.earnings,
          jobs: data.jobs,
        };
      });
  };

  const monthlyStats = getMonthlyStats();
  const maxMonthlyEarnings = Math.max(...monthlyStats.map(m => m.earnings), 1);

  // Get current month stats
  const currentMonth = monthlyStats[monthlyStats.length - 1];
  const previousMonth = monthlyStats[monthlyStats.length - 2];
  const growthPercent = previousMonth?.earnings > 0
    ? Math.round(((currentMonth?.earnings || 0) - previousMonth.earnings) / previousMonth.earnings * 100)
    : 0;

  // Calculate rating based on completion rate
  const completionRate = totalJobs > 0 ? completedJobs / totalJobs : 0;
  const rating = Math.min(5, Math.round(completionRate * 5 * 10) / 10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-slate-500">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Profile Header */}
      <header className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-4 pt-8 pb-12 safe-area-top">
        <div className="text-center">
          {/* Avatar */}
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
            <User className="h-12 w-12 text-white" />
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold">{user?.name || 'Usuario'}</h1>

          {/* Rating */}
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-white/30'
                }`}
              />
            ))}
            <span className="text-sm ml-2 text-blue-200">{rating.toFixed(1)}</span>
          </div>

          {/* Badge */}
          {completedJobs >= 10 && (
            <Badge className="mt-3 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
              <Award className="h-3.5 w-3.5 mr-1" />
              Top Pintor
            </Badge>
          )}
        </div>
      </header>

      <div className="px-4 -mt-6 space-y-4">
        {/* This Month Card */}
        <Card className="bg-white shadow-lg border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700">Este Mes</h3>
              {growthPercent !== 0 && (
                <Badge
                  variant="outline"
                  className={growthPercent > 0 ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-red-600 border-red-200 bg-red-50'}
                >
                  <TrendingUp className={`h-3 w-3 mr-1 ${growthPercent < 0 ? 'rotate-180' : ''}`} />
                  {growthPercent > 0 ? '+' : ''}{growthPercent}%
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{currentMonth?.jobs || 0}</p>
                <p className="text-sm text-slate-500">Trabalhos</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(currentMonth?.earnings || 0)}
                </p>
                <p className="text-sm text-slate-500">Ganhos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Historico
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {monthlyStats.map((month, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-500 w-8">{month.month}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(month.earnings / maxMonthlyEarnings) * 100}
                        className="h-3 flex-1"
                      />
                      <span className="text-sm font-bold text-emerald-600 w-24 text-right">
                        {formatCurrency(month.earnings)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Total */}
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Geral</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalEarnings)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{completedJobs}</p>
                <p className="text-xs text-slate-500">trabalhos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <span className="text-sm">{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <span className="text-sm">{formatPhoneUS(user.phone)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full h-14 text-red-600 border-red-200 hover:bg-red-50"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5 mr-2" />
          )}
          Sair da Conta
        </Button>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-slate-400">
          <p>PaintPro v1.0</p>
        </div>
      </div>
    </div>
  );
}

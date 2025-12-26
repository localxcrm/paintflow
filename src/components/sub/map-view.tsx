'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, DollarSign, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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

interface MapViewProps {
  jobs: Job[];
}

export function MapView({ jobs }: MapViewProps) {
  const router = useRouter();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'Hoje';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Amanha';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const getDateColor = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'bg-emerald-500 text-white';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'bg-amber-500 text-white';
    } else {
      return 'bg-slate-200 text-slate-700';
    }
  };

  const openInMaps = (address: string, city: string) => {
    const fullAddress = `${address}, ${city}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    // Try to open in native maps app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?q=${encodedAddress}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  const openNavigation = (address: string, city: string) => {
    const fullAddress = `${address}, ${city}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${encodedAddress}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
    }
  };

  // Sort jobs by date
  const sortedJobs = [...jobs].sort((a, b) => {
    if (!a.scheduledStartDate) return 1;
    if (!b.scheduledStartDate) return -1;
    return new Date(a.scheduledStartDate).getTime() - new Date(b.scheduledStartDate).getTime();
  });

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-slate-500 text-lg">Nenhum trabalho para navegar</p>
          <p className="text-slate-400 text-sm mt-1">
            Seus locais de trabalho aparecerão aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 px-1">
        Toque no endereço para abrir no mapa
      </p>

      {sortedJobs.map(job => (
        <Card key={job.id} className="overflow-hidden">
          <CardContent className="p-0">
            {/* Date Badge */}
            {job.scheduledStartDate && (
              <div className={`px-4 py-2 ${getDateColor(job.scheduledStartDate)} font-bold text-sm`}>
                {formatDate(job.scheduledStartDate)}
              </div>
            )}

            {/* Job Info */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-lg leading-tight">
                    {job.address}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {job.city}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {job.clientName}
                  </p>
                </div>
              </div>

              {/* Progress and Value */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Progress value={job.progress} className="h-2 w-16" />
                  <span className="text-sm text-slate-500">{job.progress}%</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-bold">
                  <DollarSign className="h-4 w-4" />
                  {formatCurrency(job.subcontractorPrice || 0)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => openInMaps(job.address, job.city)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver no Mapa
                </Button>
                <Button
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                  onClick={() => openNavigation(job.address, job.city)}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Navegar
                </Button>
              </div>

              {/* View Details */}
              {job.workOrder && (
                <Button
                  variant="ghost"
                  className="w-full mt-2 text-slate-500"
                  onClick={() => router.push(`/sub/os/${job.workOrder!.id}`)}
                >
                  Ver detalhes da OS
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Home,
  CheckSquare,
  Package,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  WorkOrder,
  WorkOrderRoom,
  WorkOrderTask,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_COLORS,
} from '@/types/work-order';
import { CelebrationOverlay } from '@/components/sub/confetti';
import { PhotoReminder } from '@/components/sub/photo-reminder';
import { MediaGallery, MediaItem } from '@/components/work-order/media-gallery';
import { isNativeApp, pickPhoto, photoToFile } from '@/lib/capacitor-camera';
import { uploadFileDirect } from '@/lib/supabase';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SubOSDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPhotoReminder, setShowPhotoReminder] = useState<'before' | 'after' | null>(null);
  const [hasShownBeforeReminder, setHasShownBeforeReminder] = useState(false);
  const [previousProgress, setPreviousProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWorkOrder();
  }, [id]);

  // Poll for updates (photos)
  useEffect(() => {
    if (!workOrder) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sub/os/${id}`);
        if (res.ok) {
          const data = await res.json();
          // Only update if photos changed
          if (JSON.stringify(data.photos) !== JSON.stringify(workOrder.photos)) {
            setWorkOrder(data);
          }
        }
      } catch (error) {
        console.error('Error polling:', error);
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [id, workOrder]);

  const loadWorkOrder = async () => {
    try {
      const res = await fetch(`/api/sub/os/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('OS nao encontrada');
        } else if (res.status === 403) {
          setError('Acesso nao autorizado');
        } else {
          setError('Erro ao carregar OS');
        }
        return;
      }
      const data = await res.json();
      setWorkOrder(data);

      // Calculate initial progress and show before reminder if needed
      const tasks = data.tasks || [];
      const completed = tasks.filter((t: WorkOrderTask) => t.completed).length;
      const total = tasks.length;
      const initialProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
      setPreviousProgress(initialProgress);

      // Show "before" photo reminder if starting fresh
      if (initialProgress === 0 && total > 0 && !hasShownBeforeReminder) {
        setTimeout(() => {
          setShowPhotoReminder('before');
          setHasShownBeforeReminder(true);
        }, 500);
      }
    } catch {
      setError('Erro ao carregar OS');
    } finally {
      setIsLoading(false);
    }
  };

  const saveWorkOrder = async (updates: Partial<WorkOrder>) => {
    if (!workOrder) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/sub/os/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to save');

      const updated = await res.json();
      setWorkOrder(updated);
      toast.success('Salvo!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTask = (taskId: string) => {
    if (!workOrder) return;

    const updatedTasks = workOrder.tasks.map((task: WorkOrderTask) =>
      task.id === taskId
        ? {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : undefined,
            completedBy: !task.completed ? 'subcontractor' : undefined,
          }
        : task
    );

    // Calculate new progress
    const completedCount = updatedTasks.filter((t: WorkOrderTask) => t.completed).length;
    const totalCount = updatedTasks.length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Show celebration and after photo reminder when completing all tasks
    if (newProgress === 100 && previousProgress !== null && previousProgress < 100) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        setShowPhotoReminder('after');
      }, 2500);
    }

    setPreviousProgress(newProgress);
    setWorkOrder({ ...workOrder, tasks: updatedTasks });
    saveWorkOrder({ tasks: updatedTasks });
  };

  const toggleRoom = (roomId: string) => {
    if (!workOrder) return;

    const updatedRooms = workOrder.rooms.map((room: WorkOrderRoom) =>
      room.id === roomId ? { ...room, completed: !room.completed } : room
    );

    setWorkOrder({ ...workOrder, rooms: updatedRooms });
    saveWorkOrder({ rooms: updatedRooms });
  };

  // Add photo to gallery
  const handleAddMedia = async (media: MediaItem) => {
    if (!workOrder) return;

    const newPhoto = {
      id: media.id,
      url: media.url,
      path: media.path,
      type: 'progress' as const,
      caption: media.caption || '',
      uploadedAt: media.uploadedAt,
      uploadedBy: 'subcontractor' as const,
    };

    const updatedPhotos = [...(workOrder.photos || []), newPhoto];

    setWorkOrder({ ...workOrder, photos: updatedPhotos });
    await saveWorkOrder({ photos: updatedPhotos });
  };

  // Handle native camera capture for photo reminder
  const handleNativeCamera = async () => {
    if (!workOrder) return;

    try {
      const photo = await pickPhoto();
      if (!photo) return;

      const file = await photoToFile(photo);
      if (file) {
        const data = await uploadFileDirect(
          file,
          workOrder.organizationId,
          'work-order',
          workOrder.id,
          file.name
        );

        await handleAddMedia({
          id: crypto.randomUUID(),
          url: data.url,
          path: data.path,
          type: 'photo',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Subcontratado',
        });
        toast.success('Foto adicionada!');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Erro ao capturar foto');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <h1 className="text-lg font-bold text-slate-800 mb-1">{error}</h1>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!workOrder) return null;

  const completedTasks = workOrder.tasks.filter((t: WorkOrderTask) => t.completed).length;
  const totalTasks = workOrder.tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '-';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const job = workOrder.job;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 safe-area-top">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-slate-900 truncate">
                {workOrder.osNumber}
              </h1>
              <Badge className={WORK_ORDER_STATUS_COLORS[workOrder.status]}>
                {WORK_ORDER_STATUS_LABELS[workOrder.status]}
              </Badge>
            </div>
            {job && (
              <p className="text-sm text-slate-500 truncate">{job.address}</p>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Progress Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-lg font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3 bg-blue-400/30" />
            <p className="text-xs text-blue-100 mt-2">
              {completedTasks}/{totalTasks} tarefas concluídas
            </p>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Organization Logo */}
            {workOrder.organization?.logo && (
              <div className="flex justify-center pb-2 border-b">
                <Image
                  src={workOrder.organization.logo}
                  alt={workOrder.organization.name || 'Logo'}
                  width={100}
                  height={40}
                  className="h-8 w-auto object-contain"
                />
              </div>
            )}

            {job && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800">{job.address}</p>
                  <p className="text-sm text-slate-500">
                    {job.city}{job.state ? `, ${job.state}` : ''} {job.zipCode}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Data</p>
                  <p className="text-sm font-medium">{formatDate(workOrder.scheduledDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Estimado</p>
                  <p className="text-sm font-medium">{workOrder.estimatedDuration || 8}h</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-green-700">Seu Pagamento</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(workOrder.subcontractorPrice)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rooms */}
        {workOrder.rooms.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                Cômodos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {workOrder.rooms.map((room: WorkOrderRoom) => (
                <div
                  key={room.id}
                  className={`p-3 rounded-lg border transition-all ${
                    room.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={room.completed}
                      onCheckedChange={() => toggleRoom(room.id)}
                      disabled={isSaving}
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${room.completed ? 'text-green-700 line-through' : 'text-slate-800'}`}>
                        {room.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {room.scope.join(' • ')}
                      </p>
                      {room.color && (
                        <p className="text-xs text-blue-600 mt-0.5">
                          🎨 {room.color}
                        </p>
                      )}
                    </div>
                    {room.completed && <Check className="h-5 w-5 text-green-600" />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Checklist */}
        {workOrder.tasks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {workOrder.tasks
                .sort((a: WorkOrderTask, b: WorkOrderTask) => a.order - b.order)
                .map((task: WorkOrderTask) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                      task.completed ? 'bg-green-50' : ''
                    }`}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                      disabled={isSaving}
                    />
                    <span className={`flex-1 text-sm ${
                      task.completed ? 'text-green-700 line-through' : 'text-slate-700'
                    }`}>
                      {task.description}
                    </span>
                    {task.completed && <Check className="h-4 w-4 text-green-600" />}
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Materials */}
        {workOrder.materials.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Materiais
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {workOrder.materials.map((material) => (
                  <li key={material.id} className="flex items-start gap-2 text-sm">
                    <span className="text-slate-400">•</span>
                    <span>
                      <span className="font-medium">{material.quantity} {material.unit}</span>
                      {' - '}
                      {material.name}
                      {material.color && (
                        <span className="text-blue-600"> ({material.color})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Galeria de Fotos */}
        <Card>
          <CardContent className="pt-6">
            <MediaGallery
              items={(workOrder.photos || []).map((photo) => {
                // Check if URL indicates it's a video
                const isVideo = photo.url?.includes('.mp4') || photo.url?.includes('.mov') || photo.url?.includes('.webm');
                return {
                  id: photo.id,
                  url: photo.url,
                  path: photo.path,
                  type: isVideo ? 'video' as const : photo.type,
                  caption: photo.caption,
                  uploadedAt: photo.uploadedAt,
                  uploadedBy: photo.uploadedBy === 'subcontractor' ? 'Subcontratado' : 'Empresa',
                };
              })}
              onAddMedia={handleAddMedia}
              organizationId={workOrder.organizationId}
              workOrderId={workOrder.id}
              canAdd={true}
              title="Fotos do Trabalho"
            />
          </CardContent>
        </Card>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed bottom-24 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-20">
          <Loader2 className="h-4 w-4 animate-spin" />
          Salvando...
        </div>
      )}

      {/* Celebration overlay */}
      <CelebrationOverlay
        isActive={showCelebration}
        message="Parabens!"
        onComplete={() => setShowCelebration(false)}
      />

      {/* Photo reminder */}
      {showPhotoReminder && (
        <PhotoReminder
          type={showPhotoReminder}
          isOpen={true}
          onTakePhoto={() => {
            setShowPhotoReminder(null);
            if (isNativeApp()) {
              handleNativeCamera();
            } else {
              fileInputRef.current?.click();
            }
          }}
          onSkip={() => setShowPhotoReminder(null)}
        />
      )}
    </div>
  );
}

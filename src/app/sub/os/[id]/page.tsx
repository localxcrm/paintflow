'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Home,
  CheckSquare,
  Package,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Check,
  Image as ImageIcon,
  Mic,
  Video,
  Plus,
  Camera,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  WorkOrder,
  WorkOrderRoom,
  WorkOrderTask,
  WorkOrderComment,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_COLORS,
} from '@/types/work-order';
import { MediaMessage } from '@/components/chat/media-message';
import { AudioRecorder } from '@/components/chat/audio-recorder';
import { CelebrationOverlay } from '@/components/sub/confetti';
import { PhotoReminder } from '@/components/sub/photo-reminder';
import { isNativeApp, pickPhoto, photoToFile } from '@/lib/capacitor-camera';

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
  const [newComment, setNewComment] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPhotoReminder, setShowPhotoReminder] = useState<'before' | 'after' | null>(null);
  const [hasShownBeforeReminder, setHasShownBeforeReminder] = useState(false);
  const [previousProgress, setPreviousProgress] = useState<number | null>(null);
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadWorkOrder();
  }, [id]);

  // Poll for new comments
  useEffect(() => {
    if (!workOrder) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sub/os/${id}`);
        if (res.ok) {
          const data = await res.json();
          // Only update if comments changed
          if (JSON.stringify(data.comments) !== JSON.stringify(workOrder.comments)) {
            setWorkOrder(data);
          }
        }
      } catch (error) {
        console.error('Error polling:', error);
      }
    }, 10000);

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

  const addComment = () => {
    if (!workOrder || !newComment.trim()) return;

    const comment: WorkOrderComment = {
      id: `comment-${Date.now()}`,
      type: 'text',
      text: newComment.trim(),
      author: 'Subcontratado',
      authorType: 'subcontractor',
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...workOrder.comments, comment];
    setWorkOrder({ ...workOrder, comments: updatedComments });
    saveWorkOrder({ comments: updatedComments });
    setNewComment('');

    // Scroll to bottom
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const addMediaComment = async (
    mediaData: { type: 'audio' | 'image' | 'video'; url: string; path: string; duration?: number }
  ) => {
    if (!workOrder) return;

    const comment: WorkOrderComment = {
      id: `comment-${Date.now()}`,
      type: mediaData.type,
      mediaUrl: mediaData.url,
      mediaPath: mediaData.path,
      mediaDuration: mediaData.duration,
      author: 'Subcontratado',
      authorType: 'subcontractor',
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...workOrder.comments, comment];
    setWorkOrder({ ...workOrder, comments: updatedComments });
    await saveWorkOrder({ comments: updatedComments });
  };

  const handleAudioRecordingComplete = async (audioBlob: Blob, duration: number, mimeType: string) => {
    if (!workOrder) return;
    setIsUploadingMedia(true);
    try {
      // Get correct file extension based on mime type
      const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('mpeg') ? 'mp3' : 'webm';
      const formData = new FormData();
      formData.append('file', audioBlob, `audio.${ext}`);
      formData.append('context', 'chat');
      formData.append('workOrderId', workOrder.id);

      const res = await fetch('/api/sub/os/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      await addMediaComment({
        type: 'audio',
        url: data.url,
        path: data.path,
        duration,
      });
      setIsRecordingAudio(false);
      toast.success('Áudio enviado!');
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('Erro ao enviar áudio');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video') => {
    if (!workOrder) return;
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadFile(file, mediaType);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // Handle native camera capture
  const handleNativeCamera = async () => {
    if (!workOrder) return;

    try {
      const photo = await pickPhoto();
      if (!photo) return; // User cancelled

      const file = await photoToFile(photo);
      if (file) {
        await uploadFile(file, 'image');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Erro ao capturar foto');
    }
  };

  // Unified upload function
  const uploadFile = async (file: File, mediaType: 'image' | 'video') => {
    if (!workOrder) return;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'chat');
      formData.append('workOrderId', workOrder.id);

      const res = await fetch('/api/sub/os/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      await addMediaComment({
        type: mediaType,
        url: data.url,
        path: data.path,
      });
      toast.success(`${mediaType === 'image' ? 'Foto' : 'Vídeo'} enviado!`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploadingMedia(false);
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

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

        {/* Chat */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {workOrder.comments.length > 0 && (
              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {workOrder.comments.map((comment: WorkOrderComment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg ${
                      comment.authorType === 'company'
                        ? 'bg-blue-50 border border-blue-100'
                        : 'bg-slate-50 border border-slate-100 ml-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {comment.authorType === 'company' ? 'Empresa' : 'Você'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    {comment.type === 'text' ? (
                      <p className="text-sm text-slate-700">{comment.text}</p>
                    ) : (
                      <MediaMessage comment={comment} />
                    )}
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'image')}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'video')}
            />

            {/* Audio Recorder */}
            {isRecordingAudio && (
              <div className="mb-4">
                <AudioRecorder
                  onRecordingComplete={handleAudioRecordingComplete}
                  onCancel={() => setIsRecordingAudio(false)}
                  isUploading={isUploadingMedia}
                />
              </div>
            )}

            {/* Chat Input Bar - WhatsApp Style */}
            {!isRecordingAudio && (
              <div className="flex items-end gap-2 pt-3 border-t">
                {/* Botão + com Sheet */}
                <Sheet open={showMediaSheet} onOpenChange={setShowMediaSheet}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10">
                      <Plus className="h-5 w-5 text-slate-600" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto rounded-t-2xl">
                    <div className="grid grid-cols-3 gap-4 p-4 pt-6">
                      {/* Câmera */}
                      <button
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                        onClick={() => {
                          setShowMediaSheet(false);
                          if (isNativeApp()) {
                            handleNativeCamera();
                          } else {
                            fileInputRef.current?.click();
                          }
                        }}
                      >
                        <div className="bg-blue-100 rounded-full p-4">
                          <Camera className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Câmera</span>
                      </button>
                      {/* Galeria */}
                      <button
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                        onClick={() => {
                          setShowMediaSheet(false);
                          fileInputRef.current?.click();
                        }}
                      >
                        <div className="bg-purple-100 rounded-full p-4">
                          <ImageIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Galeria</span>
                      </button>
                      {/* Vídeo */}
                      <button
                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                        onClick={() => {
                          setShowMediaSheet(false);
                          videoInputRef.current?.click();
                        }}
                      >
                        <div className="bg-green-100 rounded-full p-4">
                          <Video className="h-6 w-6 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Vídeo</span>
                      </button>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Input de texto */}
                <Textarea
                  placeholder="Mensagem..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 min-h-[40px] max-h-[100px] resize-none py-2 text-base rounded-2xl bg-slate-100 border-0 focus-visible:ring-1"
                  rows={1}
                  disabled={isUploadingMedia}
                />

                {/* Mic ou Send (dinâmico) */}
                {newComment.trim() ? (
                  <Button
                    size="icon"
                    onClick={addComment}
                    disabled={isSaving || isUploadingMedia}
                    className="shrink-0 h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsRecordingAudio(true)}
                    disabled={isUploadingMedia}
                    className="shrink-0 h-10 w-10"
                  >
                    <Mic className="h-5 w-5 text-slate-600" />
                  </Button>
                )}
              </div>
            )}

            {/* Loading indicator */}
            {isUploadingMedia && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </div>
            )}
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

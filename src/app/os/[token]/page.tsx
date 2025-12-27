'use client';

import { useState, useEffect, use, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Home,
  CheckSquare,
  Package,
  Camera,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Check,
  Image as ImageIcon,
  Plus,
  Mic,
  Video,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  WorkOrder,
  WorkOrderRoom,
  WorkOrderTask,
  WorkOrderPhoto,
  WorkOrderComment,
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_STATUS_COLORS,
  PHOTO_TYPE_LABELS,
} from '@/types/work-order';
import { MediaMessage } from '@/components/chat/media-message';
import { AudioRecorder } from '@/components/chat/audio-recorder';
import { PushNotificationPrompt } from '@/components/push-notification-prompt';
import { UnreadBadge } from '@/components/chat/unread-badge';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function PublicOSPage({ params }: PageProps) {
  const { token } = use(params);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoType, setPhotoType] = useState<'before' | 'progress' | 'after'>('progress');
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const lastCommentCountRef = useRef<number>(0);

  // Track unread messages from company
  const { unreadCount, hasUnread, markAsRead } = useUnreadMessages(
    workOrder?.id,
    workOrder?.comments,
    'subcontractor'
  );

  useEffect(() => {
    loadWorkOrder();
  }, [token]);

  // Poll for new comments every 10 seconds
  useEffect(() => {
    if (!workOrder) return;

    const pollForNewComments = async () => {
      try {
        const res = await fetch(`/api/os/${token}`);
        if (res.ok) {
          const data = await res.json();
          const currentCommentCount = data.comments?.length || 0;

          // Check for new comments from company
          if (currentCommentCount > lastCommentCountRef.current && lastCommentCountRef.current > 0) {
            const newComments = data.comments.slice(lastCommentCountRef.current);
            const companyComments = newComments.filter((c: WorkOrderComment) => c.authorType === 'company');

            if (companyComments.length > 0) {
              const lastComment = companyComments[companyComments.length - 1] as WorkOrderComment;
              const typeLabels: Record<string, string> = { text: 'mensagem', audio: 'áudio', image: 'foto', video: 'vídeo' };
              const typeLabel = typeLabels[lastComment.type] || 'mensagem';
              toast.info(`Nova ${typeLabel} da empresa!`, {
                description: lastComment.type === 'text' ? lastComment.text?.slice(0, 50) : undefined,
                duration: 5000,
              });
            }
          }

          lastCommentCountRef.current = currentCommentCount;
          setWorkOrder(data);
        }
      } catch (error) {
        console.error('Error polling for comments:', error);
      }
    };

    const interval = setInterval(pollForNewComments, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [token, workOrder]);

  const loadWorkOrder = async () => {
    try {
      const res = await fetch(`/api/os/${token}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Ordem de serviço não encontrada');
        } else {
          setError('Erro ao carregar ordem de serviço');
        }
        return;
      }
      const data = await res.json();
      setWorkOrder(data);
      // Initialize comment count for polling
      lastCommentCountRef.current = data.comments?.length || 0;
    } catch {
      setError('Erro ao carregar ordem de serviço');
    } finally {
      setIsLoading(false);
    }
  };

  const saveWorkOrder = async (updates: Partial<WorkOrder>) => {
    if (!workOrder) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/os/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to save');

      const updated = await res.json();
      setWorkOrder(updated);
      toast.success('Salvo com sucesso!');
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
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
  };

  const addPhoto = () => {
    if (!workOrder || !photoUrl.trim()) return;

    const photo: WorkOrderPhoto = {
      id: `photo-${Date.now()}`,
      url: photoUrl.trim(),
      type: photoType,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'subcontractor',
    };

    const updatedPhotos = [...workOrder.photos, photo];
    setWorkOrder({ ...workOrder, photos: updatedPhotos });
    saveWorkOrder({ photos: updatedPhotos });
    setPhotoUrl('');
    setShowPhotoInput(false);
    toast.success('Foto adicionada!');
  };

  // Add media comment (audio, image, video)
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

  // Handle audio recording complete
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

      const res = await fetch('/api/os/upload', {
        method: 'POST',
        headers: {
          'x-os-token': token,
        },
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
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar áudio');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Handle file upload (image/video)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video') => {
    if (!workOrder) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'chat');
      formData.append('workOrderId', workOrder.id);

      const res = await fetch('/api/os/upload', {
        method: 'POST',
        headers: {
          'x-os-token': token,
        },
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
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar arquivo');
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-slate-800 mb-1">{error}</h1>
          <p className="text-slate-500">Verifique se o link está correto.</p>
        </div>
      </div>
    );
  }

  if (!workOrder) return null;

  const completedTasks = workOrder.tasks.filter((t: WorkOrderTask) => t.completed).length;
  const totalTasks = workOrder.tasks.length;
  const completedRooms = workOrder.rooms.filter((r: WorkOrderRoom) => r.completed).length;
  const totalRooms = workOrder.rooms.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Organization Logo */}
          <div className="flex items-center justify-center gap-3 mb-3 pb-3 border-b">
            <Image
              src={workOrder.organization?.logo || '/logo.png'}
              alt={workOrder.organization?.name || 'Logo'}
              width={120}
              height={48}
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎨</span>
                <h1 className="text-lg font-bold text-slate-800">
                  {workOrder.osNumber}
                </h1>
              </div>
              {job && (
                <p className="text-sm text-slate-500">#{job.jobNumber}</p>
              )}
            </div>
            <Badge className={WORK_ORDER_STATUS_COLORS[workOrder.status]}>
              {WORK_ORDER_STATUS_LABELS[workOrder.status]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Progress Bar */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-blue-400/30 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-blue-100">
              <span>{completedTasks}/{totalTasks} tarefas</span>
              <span>{completedRooms}/{totalRooms} cômodos</span>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {job && (
              <>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800">{job.address}</p>
                    <p className="text-sm text-slate-500">
                      {job.city}{job.state ? `, ${job.state}` : ''} {job.zipCode}
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Data</p>
                  <p className="text-sm font-medium capitalize">
                    {formatDate(workOrder.scheduledDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Estimado</p>
                  <p className="text-sm font-medium">
                    {workOrder.estimatedDuration || 8} horas
                  </p>
                </div>
              </div>
            </div>

            <Separator />

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
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                Cômodos / Áreas
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={room.completed}
                        onCheckedChange={() => toggleRoom(room.id)}
                        disabled={isSaving}
                      />
                      <div>
                        <p className={`font-medium ${room.completed ? 'text-green-700 line-through' : 'text-slate-800'}`}>
                          {room.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {room.scope.join(' • ')}
                        </p>
                        {room.color && (
                          <p className="text-xs text-blue-600 mt-1">
                            🎨 {room.color} {room.colorCode && `(${room.colorCode})`}
                          </p>
                        )}
                      </div>
                    </div>
                    {room.completed && (
                      <Check className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Checklist */}
        {workOrder.tasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
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
                      task.completed ? 'bg-green-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                      disabled={isSaving}
                    />
                    <span
                      className={`flex-1 ${
                        task.completed
                          ? 'text-green-700 line-through'
                          : 'text-slate-700'
                      }`}
                    >
                      {task.description}
                    </span>
                    {task.completed && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Materials */}
        {workOrder.materials.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
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
                    <div>
                      <span className="font-medium">
                        {material.quantity} {material.unit}
                      </span>
                      {' - '}
                      <span>{material.name}</span>
                      {material.color && (
                        <span className="text-blue-600">
                          {' '}({material.color}{material.colorCode ? ` - ${material.colorCode}` : ''})
                        </span>
                      )}
                      {material.provided && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Cliente fornece
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Fotos
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhotoInput(!showPhotoInput)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {showPhotoInput && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg space-y-2">
                <Input
                  placeholder="Cole a URL da foto aqui"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
                <div className="flex gap-2">
                  {(['before', 'progress', 'after'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={photoType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPhotoType(type)}
                    >
                      {PHOTO_TYPE_LABELS[type]}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={addPhoto}
                    disabled={!photoUrl.trim() || isSaving}
                  >
                    Salvar Foto
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPhotoInput(false);
                      setPhotoUrl('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {workOrder.photos.length > 0 ? (
              <div className="space-y-4">
                {(['before', 'progress', 'after'] as const).map((type) => {
                  const photos = workOrder.photos.filter(
                    (p: WorkOrderPhoto) => p.type === type
                  );
                  if (photos.length === 0) return null;

                  return (
                    <div key={type}>
                      <p className="text-xs font-medium text-slate-500 uppercase mb-2">
                        {PHOTO_TYPE_LABELS[type]}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.map((photo: WorkOrderPhoto) => (
                          <a
                            key={photo.id}
                            href={photo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square bg-slate-100 rounded-lg overflow-hidden"
                          >
                            <img
                              src={photo.url}
                              alt={photo.caption || 'Foto'}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma foto ainda</p>
                <p className="text-xs">Adicione fotos do progresso</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Comentários
                {hasUnread && <UnreadBadge count={unreadCount} size="sm" />}
              </CardTitle>
              <PushNotificationPrompt userType="subcontractor" workOrderToken={token} compact />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {workOrder.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {workOrder.comments.map((comment: WorkOrderComment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg ${
                      comment.authorType === 'company'
                        ? 'bg-blue-50 border border-blue-100'
                        : 'bg-slate-50 border border-slate-100'
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

            {/* Message Input */}
            {!isRecordingAudio && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={markAsRead}
                    className="resize-none"
                    rows={2}
                    disabled={isUploadingMedia}
                  />
                  <Button
                    onClick={addComment}
                    disabled={!newComment.trim() || isSaving || isUploadingMedia}
                    className="shrink-0"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Media buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRecordingAudio(true)}
                    disabled={isUploadingMedia}
                    className="flex-1 gap-2"
                  >
                    <Mic className="h-4 w-4 text-red-500" />
                    Áudio
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingMedia}
                    className="flex-1 gap-2"
                  >
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    Foto
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingMedia}
                    className="flex-1 gap-2"
                  >
                    <Video className="h-4 w-4 text-purple-500" />
                    Vídeo
                  </Button>
                </div>

                {isUploadingMedia && (
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-slate-400">
          Powered by PaintPro
        </div>
      </div>

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Salvando...
        </div>
      )}
    </div>
  );
}

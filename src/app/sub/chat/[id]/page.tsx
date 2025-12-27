'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  ArrowLeft,
  Send,
  Loader2,
  Mic,
  Image as ImageIcon,
  FileText,
  Plus,
  Camera,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { WorkOrder, WorkOrderComment } from '@/types/work-order';
import { MediaMessage } from '@/components/chat/media-message';
import { AudioRecorder } from '@/components/chat/audio-recorder';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SubChatPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
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
          if (JSON.stringify(data.comments) !== JSON.stringify(workOrder.comments)) {
            setWorkOrder(data);
            scrollToBottom();
          }
        }
      } catch (error) {
        console.error('Error polling:', error);
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [id, workOrder]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [workOrder?.comments]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadWorkOrder = async () => {
    try {
      const res = await fetch(`/api/sub/os/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Conversa nao encontrada');
        } else if (res.status === 403) {
          setError('Acesso nao autorizado');
        } else {
          setError('Erro ao carregar conversa');
        }
        return;
      }
      const data = await res.json();
      setWorkOrder(data);
    } catch {
      setError('Erro ao carregar conversa');
    } finally {
      setIsLoading(false);
    }
  };

  const saveWorkOrder = async (updates: Partial<WorkOrder>) => {
    if (!workOrder) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/sub/os/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Erro ao salvar');
      }

      const updatedData = await res.json();
      setWorkOrder(updatedData);
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const addComment = async () => {
    if (!workOrder || !newComment.trim()) return;

    const comment: WorkOrderComment = {
      id: crypto.randomUUID(),
      text: newComment.trim(),
      author: 'Subcontratado',
      authorType: 'subcontractor',
      type: 'text',
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...workOrder.comments, comment];
    setNewComment('');
    setWorkOrder({ ...workOrder, comments: updatedComments });
    await saveWorkOrder({ comments: updatedComments });
    scrollToBottom();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (!file || !workOrder) return;

    const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Maximo ${mediaType === 'video' ? '50MB' : '5MB'}`);
      return;
    }

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', mediaType);
      formData.append('workOrderId', id);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Erro no upload');
      }

      const { url } = await uploadRes.json();

      const comment: WorkOrderComment = {
        id: crypto.randomUUID(),
        text: '',
        author: 'Subcontratado',
        authorType: 'subcontractor',
        type: mediaType,
        mediaUrl: url,
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [...workOrder.comments, comment];
      setWorkOrder({ ...workOrder, comments: updatedComments });
      await saveWorkOrder({ comments: updatedComments });
      toast.success(`${mediaType === 'image' ? 'Foto' : 'Video'} enviado!`);
      scrollToBottom();
    } catch {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploadingMedia(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleAudioRecordingComplete = async (audioBlob: Blob, duration: number) => {
    if (!workOrder) return;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('type', 'audio');
      formData.append('workOrderId', id);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Erro no upload');
      }

      const { url } = await uploadRes.json();

      const comment: WorkOrderComment = {
        id: crypto.randomUUID(),
        text: '',
        author: 'Subcontratado',
        authorType: 'subcontractor',
        type: 'audio',
        mediaUrl: url,
        mediaDuration: duration,
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [...workOrder.comments, comment];
      setWorkOrder({ ...workOrder, comments: updatedComments });
      await saveWorkOrder({ comments: updatedComments });
      toast.success('Audio enviado!');
      scrollToBottom();
    } catch {
      toast.error('Erro ao enviar audio');
    } finally {
      setIsUploadingMedia(false);
      setIsRecordingAudio(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = (comments: WorkOrderComment[]) => {
    const groups: { date: string; messages: WorkOrderComment[] }[] = [];

    comments.forEach((comment) => {
      const dateStr = new Date(comment.createdAt).toDateString();
      const existingGroup = groups.find((g) => g.date === dateStr);

      if (existingGroup) {
        existingGroup.messages.push(comment);
      } else {
        groups.push({ date: dateStr, messages: [comment] });
      }
    });

    return groups;
  };

  // Get display name for header
  const getDisplayName = () => {
    if (!workOrder) return '';

    const clientName = workOrder.job?.clientName || '';
    const firstName = clientName.split(' ')[0];

    if (workOrder.job) {
      const streetNumber = workOrder.job.address?.match(/^\d+/)?.[0] || '';
      const streetName = workOrder.job.address?.replace(/^\d+\s*/, '').split(',')[0] || '';
      return `${firstName} • ${streetNumber} ${streetName}`;
    }

    return firstName || 'Chat';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-slate-500">Carregando conversa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">{error}</h2>
        <Button onClick={() => router.push('/sub/chat')}>
          Voltar para Conversas
        </Button>
      </div>
    );
  }

  if (!workOrder) return null;

  const messageGroups = groupMessagesByDate(workOrder.comments);

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 safe-area-top sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/sub/chat')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 truncate">
              {getDisplayName()}
            </h1>
            <p className="text-xs text-slate-500">
              {workOrder.osNumber}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/sub/os/${id}`)}
            className="shrink-0 text-blue-600"
          >
            <FileText className="h-4 w-4 mr-1" />
            Ver OS
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {workOrder.comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-slate-500">Nenhuma mensagem ainda</p>
            <p className="text-sm text-slate-400 mt-1">
              Envie uma mensagem para iniciar a conversa
            </p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date separator */}
              <div className="flex items-center justify-center mb-4">
                <span className="px-3 py-1 bg-slate-200 rounded-full text-xs text-slate-600">
                  {formatDate(group.messages[0].createdAt)}
                </span>
              </div>

              {/* Messages */}
              <div className="space-y-2">
                {group.messages.map((comment: WorkOrderComment) => (
                  <div
                    key={comment.id}
                    className={`flex ${
                      comment.authorType === 'company' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        comment.authorType === 'company'
                          ? 'bg-white border border-slate-200 rounded-tl-sm'
                          : 'bg-blue-600 text-white rounded-tr-sm'
                      }`}
                    >
                      {comment.type === 'text' ? (
                        <p className="text-sm">{comment.text}</p>
                      ) : (
                        <MediaMessage comment={comment} />
                      )}
                      <p
                        className={`text-[10px] mt-1 ${
                          comment.authorType === 'company'
                            ? 'text-slate-400'
                            : 'text-blue-200'
                        }`}
                      >
                        {formatTime(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

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
        <div className="bg-white border-t border-slate-200 p-4">
          <AudioRecorder
            onRecordingComplete={handleAudioRecordingComplete}
            onCancel={() => setIsRecordingAudio(false)}
            isUploading={isUploadingMedia}
          />
        </div>
      )}

      {/* Chat Input Bar - WhatsApp Style */}
      {!isRecordingAudio && (
        <div className="bg-white border-t border-slate-200 p-3 safe-area-bottom">
          <div className="flex items-end gap-2">
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
                      fileInputRef.current?.click();
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  addComment();
                }
              }}
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

          {/* Loading indicator */}
          {isUploadingMedia && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

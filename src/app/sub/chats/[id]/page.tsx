'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Send,
  Loader2,
  MapPin,
  FileText,
  Camera,
  Mic,
} from 'lucide-react';
import { toast } from 'sonner';
import { ChatWithMessages, ChatMessage } from '@/types/chat';
import { MediaMessage } from '@/components/chat/media-message';
import { AudioRecorder } from '@/components/chat/audio-recorder';
import { getSupabaseClient } from '@/lib/supabase';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SubChatViewPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [chat, setChat] = useState<ChatWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChat();
    markAsRead();
  }, [id]);

  // Real-time subscription for new messages
  useEffect(() => {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel(`sub-chat-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ChatMessage',
          filter: `chatId=eq.${id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          // Only add if it's from the other party (company)
          // Our own messages are added locally when we send them
          if (newMessage.authorType === 'company') {
            setChat((prev) =>
              prev ? { ...prev, messages: [...prev.messages, newMessage] } : prev
            );
            // Mark as read since we're viewing
            markAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const loadChat = async () => {
    try {
      const res = await fetch(`/api/sub/chats/${id}`);
      if (!res.ok) throw new Error('Failed to fetch chat');
      const data = await res.json();
      setChat(data);
    } catch (error) {
      console.error('Error loading chat:', error);
      toast.error('Erro ao carregar conversa');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`/api/sub/chats/${id}`, { method: 'PUT' });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (
    text?: string,
    type: 'text' | 'audio' | 'image' | 'video' = 'text',
    mediaUrl?: string,
    mediaPath?: string,
    mediaDuration?: number
  ) => {
    if (type === 'text' && !text?.trim()) return;
    if (type !== 'text' && !mediaUrl) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/sub/chats/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text?.trim(),
          type,
          mediaUrl,
          mediaPath,
          mediaDuration,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const message = await res.json();

      setChat((prev) =>
        prev ? { ...prev, messages: [...prev.messages, message] } : prev
      );
      setNewMessage('');
      toast.success('Mensagem enviada');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendText = () => {
    sendMessage(newMessage, 'text');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mediaType: 'image' | 'video'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('context', 'chat');
      formData.append('workOrderId', chat?.workOrderId || '');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      await sendMessage(undefined, mediaType, data.url, data.path);
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error('Erro ao enviar mídia');
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAudioComplete = async (audioBlob: Blob, duration: number, mimeType: string) => {
    setIsUploadingMedia(true);
    try {
      // Get correct file extension based on mime type
      const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('mpeg') ? 'mp3' : 'webm';
      const formData = new FormData();
      formData.append('file', audioBlob, `audio.${ext}`);
      formData.append('context', 'chat');
      formData.append('workOrderId', chat?.workOrderId || '');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      await sendMessage(undefined, 'audio', data.url, data.path, duration);
      setIsRecordingAudio(false);
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('Erro ao enviar áudio');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const openDirections = () => {
    if (!chat?.workOrder?.jobSite) {
      toast.error('Endereço não disponível');
      return;
    }
    const { address, city, state, zip } = chat.workOrder.jobSite;
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;
    const url = `https://maps.apple.com/?daddr=${encodeURIComponent(fullAddress)}`;
    window.open(url, '_blank');
  };

  const openWorkOrder = () => {
    if (chat?.workOrderId) {
      router.push(`/sub/os/${chat.workOrderId}`);
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
        day: '2-digit',
        month: 'short',
      });
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';
  chat?.messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msg.createdAt, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Conversa não encontrada</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b p-4 safe-area-top">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/sub/chats')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">{chat.workOrder?.title || 'Ordem de Serviço'}</h1>
            {chat.workOrder?.jobSite && (
              <p className="text-sm text-slate-500">
                {chat.workOrder.jobSite.address}, {chat.workOrder.jobSite.city}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openDirections} className="flex-1">
            <MapPin className="h-4 w-4 mr-2" />
            Direções
          </Button>
          <Button variant="outline" size="sm" onClick={openWorkOrder} className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Ordem de Serviço
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {formatDate(group.date)}
              </span>
            </div>

            {/* Messages for this date */}
            {group.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.authorType === 'subcontractor' ? 'justify-end' : 'justify-start'} mb-2`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.authorType === 'subcontractor'
                      ? 'bg-green-500 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-900 rounded-bl-md'
                  }`}
                >
                  {message.type === 'text' ? (
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  ) : (
                    <MediaMessage
                      comment={{
                        id: message.id,
                        type: message.type,
                        text: message.text || undefined,
                        mediaUrl: message.mediaUrl || undefined,
                        mediaDuration: message.mediaDuration || undefined,
                        mediaThumbnail: message.mediaThumbnail || undefined,
                        author: message.authorName,
                        authorType: message.authorType,
                        createdAt: message.createdAt,
                      }}
                    />
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      message.authorType === 'subcontractor' ? 'text-green-100' : 'text-slate-400'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-white safe-area-bottom">
        {isRecordingAudio ? (
          <AudioRecorder
            onRecordingComplete={handleAudioComplete}
            onCancel={() => setIsRecordingAudio(false)}
            isUploading={isUploadingMedia}
          />
        ) : (
          <div className="flex items-end gap-2">
            {/* Media Button - Opens file picker directly */}
            <Button
              variant="ghost"
              size="icon"
              disabled={isUploadingMedia}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-5 w-5 text-slate-500" />
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const isVideo = file.type.startsWith('video/');
                  handleFileUpload(e, isVideo ? 'video' : 'image');
                }
              }}
              className="hidden"
            />

            {/* Audio Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRecordingAudio(true)}
              disabled={isUploadingMedia}
            >
              <Mic className="h-5 w-5 text-slate-500" />
            </Button>

            {/* Text Input */}
            <div className="flex-1">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Digite uma mensagem..."
                className="min-h-[44px] max-h-[120px] resize-none"
                rows={1}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendText}
              disabled={!newMessage.trim() || isSending || isUploadingMedia}
              size="icon"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        )}

        {isUploadingMedia && !isRecordingAudio && (
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando mídia...
          </div>
        )}
      </div>
    </div>
  );
}

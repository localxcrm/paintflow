'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Loader2,
  MapPin,
  FileText,
  Camera,
  Mic,
  Check,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { ChatWithMessages, ChatMessage } from '@/types/chat';
import { MediaMessage } from '@/components/chat/media-message';
import { AudioRecorder } from '@/components/chat/audio-recorder';
import { getSupabaseClient, uploadFileDirect } from '@/lib/supabase';
import { cn } from '@/lib/utils';

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          if (newMessage.authorType === 'company') {
            setChat((prev) =>
              prev ? { ...prev, messages: [...prev.messages, newMessage] } : prev
            );
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

  // Handle iOS keyboard
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardH = windowHeight - viewportHeight;
        const newKeyboardHeight = keyboardH > 0 ? keyboardH : 0;
        setKeyboardHeight(newKeyboardHeight);

        if (newKeyboardHeight > 0) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

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

    const organizationId = chat?.organizationId;
    if (!organizationId) {
      toast.error('Organizacao nao encontrada');
      return;
    }

    setIsUploadingMedia(true);
    try {
      const data = await uploadFileDirect(
        file,
        organizationId,
        'chat',
        chat?.workOrderId,
        file.name
      );

      await sendMessage(undefined, mediaType, data.url, data.path);
    } catch (error) {
      console.error('[Chat] Error uploading:', error);
      toast.error('Erro ao enviar midia');
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAudioComplete = async (audioBlob: Blob, duration: number, mimeType: string) => {
    const organizationId = chat?.organizationId;
    if (!organizationId) {
      toast.error('Organizacao nao encontrada');
      return;
    }

    setIsUploadingMedia(true);
    try {
      let ext = 'webm';
      if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
        ext = 'm4a';
      } else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
        ext = 'mp3';
      } else if (mimeType.includes('ogg')) {
        ext = 'ogg';
      } else if (mimeType.includes('wav')) {
        ext = 'wav';
      }

      const data = await uploadFileDirect(
        audioBlob,
        organizationId,
        'chat',
        chat?.workOrderId,
        `audio.${ext}`
      );

      await sendMessage(undefined, 'audio', data.url, data.path, duration);
      setIsRecordingAudio(false);
    } catch (error) {
      console.error('[Chat] Error uploading audio:', error);
      toast.error('Erro ao enviar audio');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const openDirections = () => {
    if (!chat?.workOrder?.jobSite) {
      toast.error('Endereco nao disponivel');
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

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F2F2F7] px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <p className="text-slate-500 mb-4">Conversa nao encontrada</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm active:scale-95 transition-transform"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#F2F2F7]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 pt-2 pb-3 safe-area-top shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/sub/chats')}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-blue-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base text-slate-900 truncate">
              {chat.workOrder?.title || 'Ordem de Servico'}
            </h1>
            {chat.workOrder?.jobSite && (
              <p className="text-xs text-slate-500 truncate">
                {chat.workOrder.jobSite.address}, {chat.workOrder.jobSite.city}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={openDirections}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 rounded-xl text-sm font-medium text-slate-700 active:bg-slate-200 transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Direcoes
          </button>
          <button
            onClick={openWorkOrder}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 rounded-xl text-sm font-medium text-slate-700 active:bg-slate-200 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Ver OS
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 overscroll-none">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <span className="text-[11px] text-slate-500 bg-slate-200/60 px-3 py-1 rounded-full font-medium">
                {formatDate(group.date)}
              </span>
            </div>

            {/* Messages for this date */}
            {group.messages.map((message, msgIndex) => {
              const isMe = message.authorType === 'subcontractor';
              const showTail = msgIndex === group.messages.length - 1 ||
                group.messages[msgIndex + 1]?.authorType !== message.authorType;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex mb-0.5",
                    isMe ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "relative max-w-[75%] px-3 py-2",
                      isMe
                        ? "bg-blue-500 text-white"
                        : "bg-white text-slate-900",
                      // Rounded corners based on position
                      isMe
                        ? showTail
                          ? "rounded-2xl rounded-br-md"
                          : "rounded-2xl"
                        : showTail
                          ? "rounded-2xl rounded-bl-md"
                          : "rounded-2xl"
                    )}
                  >
                    {message.type === 'text' ? (
                      <p className="text-[15px] leading-snug whitespace-pre-wrap">
                        {message.text}
                      </p>
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

                    {/* Time and status */}
                    <div className={cn(
                      "flex items-center gap-1 mt-1",
                      isMe ? "justify-end" : "justify-start"
                    )}>
                      <span className={cn(
                        "text-[10px]",
                        isMe ? "text-blue-100" : "text-slate-400"
                      )}>
                        {formatTime(message.createdAt)}
                      </span>
                      {isMe && (
                        <CheckCheck className={cn(
                          "h-3 w-3",
                          message.isRead ? "text-blue-100" : "text-blue-200"
                        )} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        ref={inputAreaRef}
        className="bg-white/80 backdrop-blur-xl border-t border-slate-200/50 px-4 pt-2 shrink-0 z-20"
        style={{ paddingBottom: keyboardHeight > 0 ? 8 : 'max(8px, env(safe-area-inset-bottom))' }}
      >
        {isRecordingAudio ? (
          <AudioRecorder
            onRecordingComplete={handleAudioComplete}
            onCancel={() => setIsRecordingAudio(false)}
            isUploading={isUploadingMedia}
          />
        ) : (
          <div className="flex items-end gap-2">
            {/* Media Button */}
            <button
              disabled={isUploadingMedia}
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-blue-600 active:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <Camera className="h-5 w-5" />
            </button>

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
            <button
              onClick={() => setIsRecordingAudio(true)}
              disabled={isUploadingMedia}
              className="w-9 h-9 rounded-full flex items-center justify-center text-blue-600 active:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <Mic className="h-5 w-5" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Mensagem"
                rows={1}
                className="w-full min-h-[36px] max-h-[100px] py-2 px-4 bg-slate-100 rounded-2xl text-[15px] placeholder:text-slate-400 focus:outline-none resize-none"
                style={{ lineHeight: '1.3' }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendText}
              disabled={!newMessage.trim() || isSending || isUploadingMedia}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                newMessage.trim()
                  ? "bg-blue-600 text-white active:scale-95"
                  : "bg-slate-100 text-slate-400"
              )}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {isUploadingMedia && !isRecordingAudio && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </div>
        )}
      </div>
    </div>
  );
}

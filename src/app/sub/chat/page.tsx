'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  MessageCircle,
  RefreshCw,
  Image as ImageIcon,
  Mic,
  Video,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Chat {
  id: string;
  jobId: string;
  displayName: string;
  clientName: string;
  address: string;
  city: string;
  osNumber: string;
  lastMessage: string;
  lastMessageTime: string | null;
  lastMessageType: string;
  hasUnread: boolean;
  messageCount: number;
}

export default function SubChatListPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async (showToast = false) => {
    try {
      if (showToast) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const res = await fetch('/api/sub/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
      }

      if (showToast) {
        toast.success('Atualizado!');
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `ha ${diffMins} min`;
    if (diffHours < 24) return `ha ${diffHours}h`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `ha ${diffDays} dias`;

    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-3.5 w-3.5 text-slate-400" />;
      case 'video':
        return <Video className="h-3.5 w-3.5 text-slate-400" />;
      case 'audio':
        return <Mic className="h-3.5 w-3.5 text-slate-400" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-slate-500">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Conversas</h1>
              <p className="text-sm text-slate-500">
                {chats.length} {chats.length === 1 ? 'conversa' : 'conversas'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadChats(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-5 w-5 text-slate-500", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </header>

      {/* Chat List */}
      <div className="p-4 space-y-2">
        {chats.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-slate-500 text-lg">Nenhuma conversa</p>
              <p className="text-slate-400 text-sm mt-1">
                As mensagens das suas OS aparecerão aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          chats.map((chat) => (
            <Card
              key={chat.id}
              className="cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
              onClick={() => router.push(`/sub/chat/${chat.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Unread indicator */}
                  <div className="pt-1.5">
                    {chat.hasUnread ? (
                      <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-slate-200" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={cn(
                        "font-bold text-slate-900 truncate",
                        chat.hasUnread && "text-slate-900"
                      )}>
                        {chat.displayName}
                      </h3>
                      <span className="text-xs text-slate-400 shrink-0">
                        {formatTimeAgo(chat.lastMessageTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      {getMessageIcon(chat.lastMessageType)}
                      <p className={cn(
                        "text-sm truncate",
                        chat.hasUnread ? "text-slate-700 font-medium" : "text-slate-500"
                      )}>
                        {chat.lastMessage || 'Sem mensagens'}
                      </p>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      {chat.osNumber}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

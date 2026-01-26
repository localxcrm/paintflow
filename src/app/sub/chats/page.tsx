'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, Loader2, RefreshCw, ChevronRight } from 'lucide-react';
import { ChatListItem } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SubChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadChats = useCallback(async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) {
        setIsRefreshing(true);
      }
      const res = await fetch('/api/sub/chats');
      if (!res.ok) throw new Error('Failed to fetch chats');
      const data = await res.json();
      setChats(data.chats || []);
      if (showRefreshToast) {
        toast.success('Atualizado!');
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      chat.workOrder?.title?.toLowerCase().includes(query) ||
      chat.workOrder?.jobSite?.address?.toLowerCase().includes(query) ||
      chat.lastMessagePreview?.toLowerCase().includes(query)
    );
  });

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: false,
        locale: ptBR,
      });
    } catch {
      return '';
    }
  };

  // Count total unread
  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCountSubcontractor || 0), 0);

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

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-20">
      {/* Header */}
      <header className="bg-white px-4 pt-6 pb-4 safe-area-top border-b border-slate-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
              Conversas
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {totalUnread > 0 ? `${totalUnread} nao lida${totalUnread > 1 ? 's' : ''}` : 'Comunicacao com a empresa'}
            </p>
          </div>
          <button
            onClick={() => loadChats(true)}
            disabled={isRefreshing}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <RefreshCw className={cn("h-5 w-5 text-slate-600", isRefreshing && "animate-spin")} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-100 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </header>

      {/* Chat List */}
      <div className="px-4 py-4">
        {filteredChats.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </h3>
            <p className="text-slate-500 text-sm">
              As conversas aparecerão aqui quando você receber ordens de serviço
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className="p-4 active:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/sub/chats/${chat.id}`)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar with unread badge */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    {chat.unreadCountSubcontractor > 0 && (
                      <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1.5">
                        <span className="text-white text-[10px] font-bold">
                          {chat.unreadCountSubcontractor > 99 ? '99+' : chat.unreadCountSubcontractor}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h3 className={cn(
                        "font-semibold text-slate-900 truncate",
                        chat.unreadCountSubcontractor > 0 && "text-slate-900"
                      )}>
                        {chat.workOrder?.title || 'Ordem de Serviço'}
                      </h3>
                      <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                        {formatTime(chat.lastMessageAt)}
                      </span>
                    </div>

                    {chat.workOrder?.jobSite && (
                      <p className="text-xs text-slate-500 truncate mb-1">
                        {chat.workOrder.jobSite.address}, {chat.workOrder.jobSite.city}
                      </p>
                    )}

                    <p className={cn(
                      "text-sm truncate",
                      chat.unreadCountSubcontractor > 0
                        ? "text-slate-900 font-medium"
                        : "text-slate-400"
                    )}>
                      {chat.lastMessagePreview || 'Nenhuma mensagem ainda'}
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

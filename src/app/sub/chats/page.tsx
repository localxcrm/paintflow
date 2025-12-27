'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search, Loader2 } from 'lucide-react';
import { ChatListItem } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SubChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const res = await fetch('/api/sub/chats');
      if (!res.ok) throw new Error('Failed to fetch chats');
      const data = await res.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Conversas
        </h1>
        <p className="text-slate-500 mt-1">
          Comunicação sobre suas ordens de serviço
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar conversas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Chat List */}
      {filteredChats.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">
            {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            As conversas aparecerão aqui quando você receber ordens de serviço
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredChats.map((chat) => (
            <Card
              key={chat.id}
              className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => router.push(`/sub/chats/${chat.id}`)}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  {chat.unreadCountSubcontractor > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {chat.unreadCountSubcontractor > 9 ? '9+' : chat.unreadCountSubcontractor}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {chat.workOrder?.title || 'Ordem de Serviço'}
                    </h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {formatTime(chat.lastMessageAt)}
                    </span>
                  </div>
                  {chat.workOrder?.jobSite && (
                    <p className="text-sm text-slate-500 truncate">
                      {chat.workOrder.jobSite.address}, {chat.workOrder.jobSite.city}
                    </p>
                  )}
                  <p className={`text-sm truncate mt-1 ${chat.unreadCountSubcontractor > 0 ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                    {chat.lastMessagePreview || 'Nenhuma mensagem ainda'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

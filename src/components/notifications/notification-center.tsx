'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from './notification-item';
import { toast } from 'sonner';

interface Notification {
  id: string;
  userId: string;
  userType: 'admin' | 'sub';
  organizationId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

interface NotificationCenterProps {
  userType: 'admin' | 'sub';
  onClose: () => void;
  onUpdate?: () => void;
}

export function NotificationCenter({ userType, onClose, onUpdate }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const endpoint = userType === 'admin' ? '/api/notifications' : '/api/sub/notifications';
      const res = await fetch(endpoint);

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userType]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const endpoint = userType === 'admin' ? '/api/notifications' : '/api/sub/notifications';
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    if (unreadNotifications.length === 0) return;

    try {
      setMarkingAllRead(true);
      const endpoint = userType === 'admin' ? '/api/notifications' : '/api/sub/notifications';

      // Mark all as read sequentially
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: n.id, isRead: true }),
          })
        )
      );

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );

      if (onUpdate) {
        onUpdate();
      }

      toast.success('Todas notificacoes marcadas como lidas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Erro ao marcar notificacoes como lidas');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">Notificacoes</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markingAllRead}
            className="text-xs"
          >
            {markingAllRead ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Marcando...
              </>
            ) : (
              'Marcar todas como lidas'
            )}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1 max-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            <p>Nenhuma notificacao</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkAsRead}
                userType={userType}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

'use client';

import { AlertTriangle, FileText, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  userType: 'admin' | 'sub';
}

export function NotificationItem({ notification, onMarkRead, userType }: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    // Mark as read
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'compliance_expiring' || notification.type === 'compliance_expired') {
      if (userType === 'sub') {
        router.push('/sub/perfil#compliance');
      } else {
        // For admin, navigate to equipe page or specific sub if subId in data
        const subId = notification.data?.subId as string | undefined;
        if (subId) {
          router.push('/equipe');
        } else {
          router.push('/equipe');
        }
      }
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'compliance_expiring':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'compliance_expired':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-blue-500" />;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left p-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0',
        !notification.isRead && 'bg-blue-50/50'
      )}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-slate-900">{notification.title}</p>
            {!notification.isRead && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
            )}
          </div>
          <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
          <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
        </div>
      </div>
    </button>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationCenter } from './notification-center';

interface NotificationBellProps {
  userType: 'admin' | 'sub';
}

export function NotificationBell({ userType }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const endpoint = userType === 'admin' ? '/api/notifications' : '/api/sub/notifications';
      const res = await fetch(endpoint);

      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [userType]);

  // Refresh count when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchUnreadCount();
    }
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center bg-red-500 hover:bg-red-500 text-white text-xs font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <NotificationCenter
          userType={userType}
          onClose={() => setIsOpen(false)}
          onUpdate={fetchUnreadCount}
        />
      </PopoverContent>
    </Popover>
  );
}

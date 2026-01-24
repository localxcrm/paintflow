'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Clock, MessageCircle, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { Badge } from '@/components/ui/badge';

const navItems = [
  {
    href: '/sub/dashboard',
    label: 'Inicio',
    icon: Home,
  },
  {
    href: '/sub/os',
    label: 'OS',
    icon: FileText,
  },
  {
    href: '/sub/horas',
    label: 'Horas',
    icon: Clock,
  },
  {
    href: '/sub/chats',
    label: 'Chat',
    icon: MessageCircle,
  },
  {
    href: 'notifications', // Special case - opens Sheet, not navigation
    label: 'Alertas',
    icon: Bell,
  },
  {
    href: '/sub/perfil',
    label: 'Conta',
    icon: User,
  },
];

// Haptic feedback for iOS
function triggerHaptic() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10);
  }
  // iOS Capacitor haptics would go here
}

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/sub/notifications');
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
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Glass effect background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]" />

      <div className="relative flex items-center justify-around h-[52px]">
        {navItems.map((item) => {
          // Special handling for notifications
          if (item.href === 'notifications') {
            return (
              <Sheet key={item.href} open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <SheetTrigger asChild>
                  <button
                    onClick={() => triggerHaptic()}
                    className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 active:scale-90 text-slate-400 active:text-slate-600"
                  >
                    <div className="relative transition-transform duration-200">
                      <Bell className="h-[22px] w-[22px] stroke-[1.5px]" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-2 h-4 min-w-[16px] px-1 flex items-center justify-center bg-red-500 hover:bg-red-500 text-white text-[9px] font-bold">
                          {unreadCount > 99 ? '99' : unreadCount}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[70vh] p-0">
                  <NotificationCenter
                    userType="sub"
                    onClose={() => setNotificationsOpen(false)}
                    onUpdate={fetchUnreadCount}
                  />
                </SheetContent>
              </Sheet>
            );
          }

          // Regular navigation items
          const isActive = pathname === item.href ||
            (item.href !== '/sub/dashboard' && pathname.startsWith(item.href + '/'));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => triggerHaptic()}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 active:scale-90',
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-400 active:text-slate-600'
              )}
            >
              <div className={cn(
                'relative transition-transform duration-200',
                isActive && mounted && 'scale-110'
              )}>
                <Icon
                  className={cn(
                    'h-[22px] w-[22px] transition-all duration-200',
                    isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                  )}
                  fill={isActive ? 'currentColor' : 'none'}
                  fillOpacity={isActive ? 0.15 : 0}
                />
              </div>
              <span className={cn(
                'text-[10px] transition-all duration-200',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

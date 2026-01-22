'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Users, BookOpen, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    href: '/sub/equipe',
    label: 'Equipe',
    icon: Users,
  },
  {
    href: '/sub/treinamento',
    label: 'Treino',
    icon: BookOpen,
  },
  {
    href: '/sub/chats',
    label: 'Chats',
    icon: MessageCircle,
  },
  {
    href: '/sub/perfil',
    label: 'Perfil',
    icon: User,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/sub/chats');
        if (res.ok) {
          const data = await res.json();
          const total = (data.chats || []).reduce(
            (sum: number, chat: { unreadCountSubcontractor: number }) => sum + (chat.unreadCountSubcontractor || 0),
            0
          );
          setUnreadCount(total);
        }
      } catch {
        // Silently fail
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/sub/dashboard' && pathname.startsWith(item.href + '/'));
          const Icon = item.icon;
          const showBadge = item.href === '/sub/chats' && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative',
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-6 w-6', isActive && 'fill-current')} />
                {showBadge && (
                  <div className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute top-1 w-1 h-1 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

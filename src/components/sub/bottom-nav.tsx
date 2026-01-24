'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Clock, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Glass effect background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]" />

      <div className="relative flex items-center justify-around h-[52px]">
        {navItems.map((item) => {
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

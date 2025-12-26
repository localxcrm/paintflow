'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, BookOpen, MessageCircle, User } from 'lucide-react';
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
    href: '/sub/treinamento',
    label: 'Treino',
    icon: BookOpen,
  },
  {
    href: '/sub/chat',
    label: 'Chat',
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/sub/dashboard' && pathname.startsWith(item.href + '/'));
          const Icon = item.icon;

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
              <Icon className={cn('h-6 w-6', isActive && 'fill-current')} />
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

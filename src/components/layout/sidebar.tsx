'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Target,
  Briefcase,
  Megaphone,
  TrendingUp,
  BookOpen,
  PaintBucket,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/goals', label: 'Metas', icon: Target },
  { href: '/jobs', label: 'Trabalhos', icon: Briefcase },
  { href: '/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/vendas', label: 'Vendas', icon: TrendingUp },
  { href: '/conhecimento', label: 'Conhecimento', icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-700">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
          <PaintBucket className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold">PaintPro</h1>
          <p className="text-xs text-slate-400">Fórmula $1 Milhão</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

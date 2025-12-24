'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, User, Settings, Users, LayoutDashboard, Target, Briefcase, Megaphone, TrendingUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { authApi } from '@/lib/api';
import { useOrganization } from '@/contexts/organization-context';
import { cn } from '@/lib/utils';

interface UserData {
  email: string;
  name: string;
  loggedInAt: string;
  role?: string;
}

const navItems = [
  { href: '/painel', label: 'Painel', icon: LayoutDashboard },
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/vendas', label: 'Vendas', icon: TrendingUp },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/conhecimento', label: 'Conhecimento', icon: BookOpen },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [mounted, setMounted] = useState(false);
  const { organization } = useOrganization();

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem('paintpro_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('paintpro_user');
      }
    }
  }, []);

  const handleLogout = async () => {
    await authApi.logout();
    localStorage.removeItem('paintpro_user');
    router.push('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between h-20 px-4 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/painel" className="flex-shrink-0">
            <Image
              src={organization?.logo || '/logo.png'}
              alt={organization?.name || 'PaintFlow'}
              width={270}
              height={72}
              className="h-[60px] w-auto object-contain"
              priority
            />
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-[#0D5C75] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User menu - only render after mount to avoid hydration mismatch */}
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#0D5C75] text-white text-sm">
                    {user ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex md:flex-col md:items-start">
                  <span className="text-sm font-medium">{user?.name || 'User'}</span>
                  <span className="text-xs text-slate-500">Owner</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name || 'User'}</span>
                  <span className="text-xs font-normal text-slate-500">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/perfil" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/configuracoes" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/equipe" className="flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Equipe
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 px-2">
            <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
            <div className="hidden md:flex md:flex-col md:items-start gap-1">
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-12 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

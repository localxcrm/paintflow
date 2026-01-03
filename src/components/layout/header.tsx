'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, User, Settings, Users, LayoutDashboard, Target, Briefcase, Megaphone, TrendingUp, BookOpen, MessageSquare, Menu, X } from 'lucide-react';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
  { href: '/chats', label: 'Chats', icon: MessageSquare },
  { href: '/conhecimento', label: 'Conhecimento', icon: BookOpen },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Fetch unread chats count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/chats');
        if (res.ok) {
          const data = await res.json();
          const total = (data.chats || []).reduce(
            (sum: number, chat: { unreadCountCompany: number }) => sum + (chat.unreadCountCompany || 0),
            0
          );
          setUnreadChatsCount(total);
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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-all duration-300 safe-top">
      <div className="flex items-center justify-between h-20 md:h-24 px-4 lg:px-8 max-w-[2000px] mx-auto">
        {/* Logo & Nav */}
        <div className="flex items-center gap-4 lg:gap-10">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-brand-teal hover:bg-slate-100 rounded-xl transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-200">
                  <Image
                    src={organization?.logo || '/logo.png'}
                    alt={organization?.name || 'PaintFlow'}
                    width={180}
                    height={48}
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <nav className="flex-1 p-4 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const showBadge = item.href === '/chats' && unreadChatsCount > 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200',
                          active
                            ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-brand-teal'
                        )}
                      >
                        <div className="relative">
                          <Icon className="w-5 h-5" />
                          {showBadge && (
                            <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-1">
                              {unreadChatsCount > 99 ? '99+' : unreadChatsCount}
                            </div>
                          )}
                        </div>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/painel" className="flex-shrink-0 group">
            <div className="relative">
              <Image
                src={organization?.logo || '/logo.png'}
                alt={organization?.name || 'PaintFlow'}
                width={270}
                height={72}
                className="h-[56px] w-auto object-contain transition-transform group-hover:scale-105 duration-300"
                priority
              />
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/30">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const showBadge = item.href === '/chats' && unreadChatsCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 relative',
                    active
                      ? 'bg-brand-teal text-white shadow-lg shadow-brand-teal/20 scale-105'
                      : 'text-slate-600 hover:bg-white hover:text-brand-teal hover:shadow-sm'
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("w-4 h-4", active ? "animate-pulse" : "")} />
                    {showBadge && (
                      <div className="absolute -top-2 -right-2 min-w-[16px] h-[16px] bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-1">
                        {unreadChatsCount > 99 ? '99+' : unreadChatsCount}
                      </div>
                    )}
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User menu */}
        {mounted ? (
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 px-3 h-12 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/50 transition-all">
                  <div className="relative">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-brand-teal to-brand-teal-light text-white text-xs font-bold">
                        {user ? getInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="hidden md:flex md:flex-col md:items-start leading-tight">
                    <span className="text-sm font-bold text-slate-800">{user?.name || 'User'}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Business Owner</span>
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
          </div>
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

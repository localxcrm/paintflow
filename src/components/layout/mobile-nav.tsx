'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calculator,
  Briefcase,
  DollarSign,
  BookOpen,
  Settings,
  Target,
  BarChart3,
  Mountain,
  CheckSquare,
  AlertCircle,
  GitBranch,
  Calendar,
  UserCheck,
  ChevronDown,
  PaintBucket,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetClose } from '@/components/ui/sheet';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/estimates', label: 'Estimates', icon: Calculator },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/financials', label: 'Financials', icon: DollarSign },
  { href: '/price-book', label: 'Price Book', icon: BookOpen },
];

const tractionNavItems = [
  { href: '/traction/vto', label: 'V/TO', icon: Target },
  { href: '/traction/scorecard', label: 'Scorecard', icon: BarChart3 },
  { href: '/traction/rocks', label: 'Rocks', icon: Mountain },
  { href: '/traction/todos', label: 'To-Dos', icon: CheckSquare },
  { href: '/traction/issues', label: 'Issues', icon: AlertCircle },
  { href: '/traction/accountability', label: 'Accountability', icon: GitBranch },
  { href: '/traction/meetings', label: 'L10 Meetings', icon: Calendar },
  { href: '/traction/people', label: 'People', icon: UserCheck },
];

export function MobileNav() {
  const pathname = usePathname();
  const [tractionOpen, setTractionOpen] = useState(pathname.startsWith('/traction'));

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-700">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
          <PaintBucket className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold">PaintPro</h1>
          <p className="text-xs text-slate-400">Business OS</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="px-3 py-4 space-y-1">
          {/* Main Nav */}
          <div className="mb-6">
            <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Operations
            </p>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </SheetClose>
              );
            })}
          </div>

          {/* Traction/EOS Nav */}
          <Collapsible open={tractionOpen} onOpenChange={setTractionOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  EOS / Traction
                </p>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-slate-400 transition-transform',
                    tractionOpen && 'rotate-180'
                  )}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {tractionNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </SheetClose>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </ScrollArea>

      {/* Settings at bottom */}
      <div className="px-3 py-4 border-t border-slate-700">
        <SheetClose asChild>
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === '/settings'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </SheetClose>
      </div>
    </div>
  );
}

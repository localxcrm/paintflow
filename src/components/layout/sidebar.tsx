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
  Star,
  TrendingUp,
  Megaphone,
  Building2,
  LineChart,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/estimates', label: 'Estimates', icon: Calculator },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/price-book', label: 'Price Book', icon: BookOpen },
];

const financialNavItems = [
  { href: '/financials', label: 'Overview', icon: DollarSign },
  { href: '/financials/marketing', label: 'Marketing Spend', icon: Megaphone },
  { href: '/financials/overhead', label: 'Overhead', icon: Building2 },
];

const planningNavItems = [
  { href: '/goals', label: 'Goals & Targets', icon: Target },
  { href: '/scenarios', label: 'Scenario Planner', icon: LineChart },
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

export function Sidebar() {
  const pathname = usePathname();
  const [tractionOpen, setTractionOpen] = useState(pathname.startsWith('/traction'));
  const [financialsOpen, setFinancialsOpen] = useState(pathname.startsWith('/financials'));
  const [planningOpen, setPlanningOpen] = useState(pathname.startsWith('/goals') || pathname.startsWith('/scenarios'));

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 text-white">
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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Main Nav */}
        <div className="mb-4">
          <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Operations
          </p>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
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
            );
          })}
        </div>

        {/* Financials Nav */}
        <Collapsible open={financialsOpen} onOpenChange={setFinancialsOpen} className="mb-4">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Financials
              </p>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-slate-400 transition-transform',
                  financialsOpen && 'rotate-180'
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {financialNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
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
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Planning Nav */}
        <Collapsible open={planningOpen} onOpenChange={setPlanningOpen} className="mb-4">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Planning
              </p>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-slate-400 transition-transform',
                  planningOpen && 'rotate-180'
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {planningNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
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
              );
            })}
          </CollapsibleContent>
        </Collapsible>

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
                <Link
                  key={item.href}
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
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 py-4 border-t border-slate-700">
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
      </div>
    </aside>
  );
}

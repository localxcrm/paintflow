'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNav } from '@/components/sub/bottom-nav';
import { Loader2, Bell } from 'lucide-react';
import { Toaster } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { Badge } from '@/components/ui/badge';

interface SubUser {
  id: string;
  name: string;
  email: string;
}

interface SubLayoutProps {
  children: React.ReactNode;
}

export default function SubLayout({ children }: SubLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Pages that don't need the bottom nav
  const isAuthPage = pathname === '/sub/login' || pathname === '/sub/register';
  // Chat detail page has its own full-screen layout
  const isChatDetailPage = pathname.startsWith('/sub/chats/') && pathname !== '/sub/chats';

  // Fetch unread notification count
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
    const checkAuth = async () => {
      // Skip auth check on auth pages
      if (isAuthPage) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/sub/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          // Fetch notifications after auth check
          fetchUnreadCount();
        } else {
          router.push('/sub/login');
        }
      } catch {
        router.push('/sub/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router, isAuthPage]);

  // Poll for notification updates
  useEffect(() => {
    if (isAuthPage || !user) return;
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthPage, user]);

  // Show loading only for protected pages
  if (!isAuthPage && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Auth pages don't have the layout
  if (isAuthPage) {
    return (
      <>
        <Toaster position="top-center" richColors />
        {children}
      </>
    );
  }

  // Chat detail page renders full screen without bottom nav
  if (isChatDetailPage) {
    return (
      <div className="min-h-screen bg-white">
        <Toaster position="top-center" richColors />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />

      {/* Top Header with Notification Bell */}
      <header className="fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
          <div className="flex items-center justify-between h-12 px-4">
            <div className="flex-1" />
            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <SheetTrigger asChild>
                <button
                  className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label="Alertas"
                >
                  <Bell className="h-5 w-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 flex items-center justify-center bg-red-500 hover:bg-red-500 text-white text-[9px] font-bold">
                      {unreadCount > 99 ? '99' : unreadCount}
                    </Badge>
                  )}
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
          </div>
        </div>
      </header>

      {/* Main content with padding for top header and bottom nav */}
      <main className="pt-12 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

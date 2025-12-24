'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNav } from '@/components/sub/bottom-nav';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';

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

  // Pages that don't need the bottom nav
  const isAuthPage = pathname === '/sub/login' || pathname === '/sub/register';

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

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />

      {/* Main content with padding for bottom nav */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

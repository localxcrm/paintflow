'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const SESSION_TOKEN_KEY = 'paintpro_session_token';
const ORG_ID_KEY = 'paintpro_org_id';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider checks for authentication in localStorage
 * This is needed for iframe compatibility where cookies are blocked
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if we have auth in localStorage
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    const orgId = localStorage.getItem(ORG_ID_KEY);

    if (token && orgId) {
      setIsAuthenticated(true);

      // Sync to cookies if possible (for SSR)
      try {
        document.cookie = `paintpro_session=${token}; path=/; SameSite=Lax; max-age=604800`;
        document.cookie = `paintpro_org_id=${orgId}; path=/; SameSite=Lax; max-age=604800`;
      } catch {
        // Ignore cookie errors
      }
    } else {
      // Check if we have cookies but not localStorage (direct login)
      const hasCookieSession = document.cookie.includes('paintpro_session=');
      const hasCookieOrg = document.cookie.includes('paintpro_org_id=');

      if (hasCookieSession && hasCookieOrg) {
        setIsAuthenticated(true);
      } else {
        // Not authenticated - redirect to login
        setIsAuthenticated(false);
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
    }

    setIsChecking(false);
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D5C75]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

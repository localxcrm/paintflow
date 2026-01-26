'use client';

import { useEffect, useState } from 'react';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineBannerProps {
  /** Number of unsynced items */
  unsyncedCount?: number;
  /** Whether currently syncing */
  isSyncing?: boolean;
  /** Custom class name */
  className?: string;
  /** Manual sync trigger */
  onSync?: () => void;
}

/**
 * Banner shown when user is offline or has unsynced data
 */
export function OfflineBanner({
  unsyncedCount = 0,
  isSyncing = false,
  className,
  onSync,
}: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      // Keep banner visible briefly to show syncing
      setTimeout(() => {
        if (unsyncedCount === 0) {
          setShowBanner(false);
        }
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    setIsOnline(navigator.onLine);
    setShowBanner(!navigator.onLine || unsyncedCount > 0);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [unsyncedCount]);

  // Update visibility when unsynced count changes
  useEffect(() => {
    if (unsyncedCount > 0) {
      setShowBanner(true);
    } else if (isOnline) {
      setShowBanner(false);
    }
  }, [unsyncedCount, isOnline]);

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        'fixed top-12 left-0 right-0 z-40 transition-all duration-300',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium',
          isOnline
            ? 'bg-amber-50 text-amber-800 border-b border-amber-100'
            : 'bg-red-50 text-red-800 border-b border-red-100'
        )}
      >
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Sem conexão. Dados serão salvos localmente.</span>
          </>
        ) : unsyncedCount > 0 ? (
          <>
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Sincronizando {unsyncedCount} item(ns)...</span>
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4" />
                <span>{unsyncedCount} item(ns) pendente(s)</span>
                {onSync && (
                  <button
                    onClick={onSync}
                    className="ml-2 underline hover:no-underline"
                  >
                    Sincronizar
                  </button>
                )}
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

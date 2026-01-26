'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_PREFIX = 'paintflow_offline_';

interface OfflineItem<T> {
  id: string;
  data: T;
  createdAt: string;
  synced: boolean;
}

interface UseOfflineStorageOptions<T> {
  key: string;
  onSync?: (items: OfflineItem<T>[]) => Promise<{ success: string[]; failed: string[] }>;
  syncInterval?: number; // ms
}

/**
 * Hook for managing offline data storage with automatic sync
 */
export function useOfflineStorage<T>({ 
  key, 
  onSync,
  syncInterval = 30000 
}: UseOfflineStorageOptions<T>) {
  const storageKey = STORAGE_PREFIX + key;
  const [items, setItems] = useState<OfflineItem<T>[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  // Load items from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading offline storage:', error);
    }
  }, [storageKey]);

  // Track online/offline status
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

  // Save items to localStorage
  const saveToStorage = useCallback((newItems: OfflineItem<T>[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(newItems));
    } catch (error) {
      console.error('Error saving to offline storage:', error);
    }
  }, [storageKey]);

  // Add new item
  const addItem = useCallback((data: T): string => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const newItem: OfflineItem<T> = {
      id,
      data,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    setItems((prev) => {
      const updated = [...prev, newItem];
      saveToStorage(updated);
      return updated;
    });

    return id;
  }, [saveToStorage]);

  // Update item
  const updateItem = useCallback((id: string, data: Partial<T>) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id
          ? { ...item, data: { ...item.data, ...data }, synced: false }
          : item
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Remove item
  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Mark item as synced
  const markSynced = useCallback((id: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, synced: true } : item
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Sync unsynced items
  const sync = useCallback(async (): Promise<{ success: number; failed: number }> => {
    if (!onSync) return { success: 0, failed: 0 };
    
    const unsyncedItems = items.filter((item) => !item.synced);
    if (unsyncedItems.length === 0) return { success: 0, failed: 0 };

    setIsSyncing(true);
    setLastSyncError(null);

    try {
      const result = await onSync(unsyncedItems);
      
      // Mark successful items as synced
      setItems((prev) => {
        const updated = prev.map((item) =>
          result.success.includes(item.id) ? { ...item, synced: true } : item
        );
        saveToStorage(updated);
        return updated;
      });

      if (result.failed.length > 0) {
        setLastSyncError(`${result.failed.length} items failed to sync`);
      }

      return { success: result.success.length, failed: result.failed.length };
    } catch (error) {
      setLastSyncError('Sync failed. Will retry when online.');
      return { success: 0, failed: unsyncedItems.length };
    } finally {
      setIsSyncing(false);
    }
  }, [items, onSync, saveToStorage]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOnline || !onSync) return;
    
    const unsyncedCount = items.filter((item) => !item.synced).length;
    if (unsyncedCount > 0) {
      sync();
    }
  }, [isOnline, items.length]); // Intentionally not including sync to avoid loops

  // Periodic sync
  useEffect(() => {
    if (!onSync || syncInterval <= 0) return;

    const interval = setInterval(() => {
      if (isOnline) {
        sync();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [isOnline, sync, syncInterval, onSync]);

  // Get unsynced items
  const unsyncedItems = items.filter((item) => !item.synced);
  const syncedItems = items.filter((item) => item.synced);

  // Clear all synced items
  const clearSynced = useCallback(() => {
    setItems((prev) => {
      const updated = prev.filter((item) => !item.synced);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  return {
    items,
    unsyncedItems,
    syncedItems,
    unsyncedCount: unsyncedItems.length,
    isOnline,
    isSyncing,
    lastSyncError,
    addItem,
    updateItem,
    removeItem,
    markSynced,
    sync,
    clearSynced,
  };
}

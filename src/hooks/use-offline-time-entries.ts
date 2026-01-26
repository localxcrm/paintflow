'use client';

import { useCallback } from 'react';
import { useOfflineStorage } from './use-offline-storage';
import { toast } from 'sonner';

interface TimeEntryData {
  jobId: string;
  jobNumber: string;
  employeeId?: string;
  employeeName?: string;
  date: string;
  hoursWorked: number;
  notes?: string;
}

interface TimeEntryResponse {
  id: string;
  success: boolean;
}

/**
 * Hook for managing offline time entries
 */
export function useOfflineTimeEntries(subcontractorId: string) {
  // Sync function to upload time entries to server
  const handleSync = useCallback(async (items: { id: string; data: TimeEntryData }[]) => {
    const success: string[] = [];
    const failed: string[] = [];

    for (const item of items) {
      try {
        const response = await fetch('/api/sub/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...item.data,
            offlineId: item.id,
          }),
        });

        if (response.ok) {
          success.push(item.id);
        } else {
          failed.push(item.id);
        }
      } catch (error) {
        console.error('Failed to sync time entry:', error);
        failed.push(item.id);
      }
    }

    if (success.length > 0) {
      toast.success(`${success.length} registro(s) sincronizado(s)`);
    }
    if (failed.length > 0) {
      toast.error(`${failed.length} registro(s) falharam`);
    }

    return { success, failed };
  }, []);

  const storage = useOfflineStorage<TimeEntryData>({
    key: `time_entries_${subcontractorId}`,
    onSync: handleSync,
    syncInterval: 60000, // Sync every minute when online
  });

  // Add a new time entry
  const addTimeEntry = useCallback((entry: TimeEntryData): string => {
    const id = storage.addItem(entry);
    
    if (storage.isOnline) {
      // Try to sync immediately
      storage.sync();
    } else {
      toast.info('Registro salvo offline. Será sincronizado quando conectar.');
    }
    
    return id;
  }, [storage]);

  // Update an existing time entry
  const updateTimeEntry = useCallback((id: string, entry: Partial<TimeEntryData>) => {
    storage.updateItem(id, entry);
  }, [storage]);

  // Delete a time entry
  const deleteTimeEntry = useCallback((id: string) => {
    storage.removeItem(id);
  }, [storage]);

  // Get all pending (unsynced) entries
  const getPendingEntries = useCallback(() => {
    return storage.unsyncedItems.map((item) => ({
      ...item.data,
      offlineId: item.id,
      createdAt: item.createdAt,
      isPending: true,
    }));
  }, [storage.unsyncedItems]);

  // Force sync
  const forceSync = useCallback(async () => {
    if (!storage.isOnline) {
      toast.error('Sem conexão. Não é possível sincronizar.');
      return { success: 0, failed: 0 };
    }
    return storage.sync();
  }, [storage]);

  return {
    // State
    pendingEntries: getPendingEntries(),
    pendingCount: storage.unsyncedCount,
    isOnline: storage.isOnline,
    isSyncing: storage.isSyncing,
    lastError: storage.lastSyncError,
    
    // Actions
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    forceSync,
    clearSynced: storage.clearSynced,
  };
}

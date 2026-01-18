'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
export type RockStatus = 'on_track' | 'off_track' | 'complete' | 'dropped';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface StatusChange {
  from: RockStatus;
  to: RockStatus;
  date: string;
  note?: string;
}

export interface Rock {
  id: string;
  title: string;
  description?: string | null;
  owner: string;
  rockType: 'company' | 'individual';
  quarter: number;
  year: number;
  status: RockStatus;
  dueDate: string;
  progress: number;
  milestones: Milestone[];
  statusHistory: StatusChange[];
  createdAt: string;
  updatedAt: string;
}

// Portuguese labels
export const ROCK_STATUS_LABELS: Record<RockStatus, string> = {
  on_track: 'No Caminho',
  off_track: 'Fora do Caminho',
  complete: 'Concluido',
  dropped: 'Abandonado',
};

export const ROCK_STATUS_CONFIG: Record<RockStatus, { label: string; className: string; bgClass: string }> = {
  on_track: { label: 'No Caminho', className: 'text-green-700', bgClass: 'bg-green-100' },
  off_track: { label: 'Fora do Caminho', className: 'text-red-700', bgClass: 'bg-red-100' },
  complete: { label: 'Concluido', className: 'text-blue-700', bgClass: 'bg-blue-100' },
  dropped: { label: 'Abandonado', className: 'text-slate-700', bgClass: 'bg-slate-100' },
};

// Helper functions
function getCurrentQuarter(): number {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

function getQuarterEndDate(quarter: number, year: number): string {
  const monthEnd = quarter * 3;
  const lastDay = new Date(year, monthEnd, 0).getDate();
  return `${year}-${String(monthEnd).padStart(2, '0')}-${lastDay}`;
}

// Calculate progress based on milestones
function calculateProgress(milestones: Milestone[]): number {
  if (!milestones || milestones.length === 0) return 0;
  const completed = milestones.filter((m: any) => m.completed).length;
  return Math.round((completed / milestones.length) * 100);
}

export interface UseRocksReturn {
  rocks: Rock[];
  isLoading: boolean;
  currentQuarter: number;
  currentYear: number;
  // CRUD operations
  addRock: (rock: Omit<Rock, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'progress'>) => Promise<void>;
  updateRock: (id: string, updates: Partial<Rock>) => Promise<void>;
  deleteRock: (id: string) => Promise<void>;
  // Status operations
  updateStatus: (id: string, status: RockStatus, note?: string) => Promise<void>;
  // Milestone operations
  toggleMilestone: (rockId: string, milestoneId: string) => Promise<void>;
  addMilestone: (rockId: string, title: string) => Promise<void>;
  deleteMilestone: (rockId: string, milestoneId: string) => Promise<void>;
  // Filters
  getRocksByQuarter: (quarter: number, year: number) => Rock[];
  getRocksByOwner: (owner: string) => Rock[];
  getCompanyRocks: () => Rock[];
  getIndividualRocks: () => Rock[];
  getCurrentQuarterRocks: () => Rock[];
  // Refresh
  refresh: () => Promise<void>;
}

export function useRocks(): UseRocksReturn {
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const quarter = getCurrentQuarter();
  const year = getCurrentYear();

  // Fetch rocks from API
  const fetchRocks = useCallback(async () => {
    try {
      const res = await fetch(`/api/rocks?quarter=${quarter}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        const rocksWithProgress = (data.rocks || []).map((rock: Rock) => ({
          ...rock,
          progress: calculateProgress(rock.milestones || []),
        }));
        setRocks(rocksWithProgress);
      }
    } catch (error) {
      console.error('Error fetching rocks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [quarter, year]);

  // Load rocks on mount
  useEffect(() => {
    fetchRocks();
  }, [fetchRocks]);

  // Add a new rock
  const addRock = useCallback(async (rock: Omit<Rock, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'progress'>) => {
    try {
      const res = await fetch('/api/rocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rock,
          statusHistory: [],
        }),
      });

      if (res.ok) {
        await fetchRocks();
      }
    } catch (error) {
      console.error('Error adding rock:', error);
    }
  }, [fetchRocks]);

  // Update a rock
  const updateRock = useCallback(async (id: string, updates: Partial<Rock>) => {
    try {
      const rock = rocks.find((r: any) => r.id === id);
      if (!rock) return;

      const res = await fetch('/api/rocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...updates,
        }),
      });

      if (res.ok) {
        await fetchRocks();
      }
    } catch (error) {
      console.error('Error updating rock:', error);
    }
  }, [rocks, fetchRocks]);

  // Delete a rock
  const deleteRock = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/rocks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchRocks();
      }
    } catch (error) {
      console.error('Error deleting rock:', error);
    }
  }, [fetchRocks]);

  // Update status with history tracking
  const updateStatus = useCallback(async (id: string, newStatus: RockStatus, note?: string) => {
    const rock = rocks.find((r: any) => r.id === id);
    if (!rock) return;

    const statusChange: StatusChange = {
      from: rock.status,
      to: newStatus,
      date: new Date().toISOString(),
      note,
    };

    await updateRock(id, {
      status: newStatus,
      statusHistory: [...(rock.statusHistory || []), statusChange],
    });
  }, [rocks, updateRock]);

  // Toggle milestone completion
  const toggleMilestone = useCallback(async (rockId: string, milestoneId: string) => {
    const rock = rocks.find((r: any) => r.id === rockId);
    if (!rock) return;

    const newMilestones = (rock.milestones || []).map(m =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    await updateRock(rockId, { milestones: newMilestones });
  }, [rocks, updateRock]);

  // Add milestone
  const addMilestone = useCallback(async (rockId: string, title: string) => {
    const rock = rocks.find((r: any) => r.id === rockId);
    if (!rock) return;

    const newMilestone: Milestone = {
      id: `${rockId}-${Date.now()}`,
      title,
      completed: false,
    };

    await updateRock(rockId, {
      milestones: [...(rock.milestones || []), newMilestone],
    });
  }, [rocks, updateRock]);

  // Delete milestone
  const deleteMilestone = useCallback(async (rockId: string, milestoneId: string) => {
    const rock = rocks.find((r: any) => r.id === rockId);
    if (!rock) return;

    await updateRock(rockId, {
      milestones: (rock.milestones || []).filter((m: any) => m.id !== milestoneId),
    });
  }, [rocks, updateRock]);

  // Filter functions
  const getRocksByQuarter = useCallback((q: number, y: number) => {
    return rocks.filter((r: any) => r.quarter === q && r.year === y);
  }, [rocks]);

  const getRocksByOwner = useCallback((owner: string) => {
    return rocks.filter((r: any) => r.owner === owner);
  }, [rocks]);

  const getCompanyRocks = useCallback(() => {
    return rocks.filter((r: any) => r.rockType === 'company');
  }, [rocks]);

  const getIndividualRocks = useCallback(() => {
    return rocks.filter((r: any) => r.rockType === 'individual');
  }, [rocks]);

  const getCurrentQuarterRocks = useCallback(() => {
    return rocks.filter((r: any) => r.quarter === getCurrentQuarter() && r.year === getCurrentYear());
  }, [rocks]);

  return {
    rocks,
    isLoading,
    currentQuarter: getCurrentQuarter(),
    currentYear: getCurrentYear(),
    addRock,
    updateRock,
    deleteRock,
    updateStatus,
    toggleMilestone,
    addMilestone,
    deleteMilestone,
    getRocksByQuarter,
    getRocksByOwner,
    getCompanyRocks,
    getIndividualRocks,
    getCurrentQuarterRocks,
    refresh: fetchRocks,
  };
}

// Export helper functions for use elsewhere
export { getCurrentQuarter, getCurrentYear, getQuarterEndDate };

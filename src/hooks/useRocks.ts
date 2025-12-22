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
  description?: string;
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

const STORAGE_KEY = 'paintpro_rocks';

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

// Default rocks for new users
function getDefaultRocks(): Rock[] {
  const quarter = getCurrentQuarter();
  const year = getCurrentYear();
  const now = new Date().toISOString();

  return [
    {
      id: '1',
      title: 'Contratar 2 pintores',
      description: 'Aumentar equipe para atender demanda de projetos',
      owner: 'Voce',
      rockType: 'company',
      quarter,
      year,
      status: 'on_track',
      dueDate: getQuarterEndDate(quarter, year),
      progress: 0,
      milestones: [
        { id: '1a', title: 'Publicar vaga', completed: false },
        { id: '1b', title: 'Entrevistar candidatos', completed: false },
        { id: '1c', title: 'Contratar e treinar', completed: false },
      ],
      statusHistory: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '2',
      title: 'Implementar CRM',
      description: 'Organizar gestao de leads e clientes',
      owner: 'Voce',
      rockType: 'company',
      quarter,
      year,
      status: 'on_track',
      dueDate: getQuarterEndDate(quarter, year),
      progress: 0,
      milestones: [
        { id: '2a', title: 'Escolher sistema', completed: false },
        { id: '2b', title: 'Configurar', completed: false },
        { id: '2c', title: 'Treinar equipe', completed: false },
      ],
      statusHistory: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '3',
      title: 'Conseguir 15 avaliacoes Google',
      description: 'Melhorar presenca online',
      owner: 'Voce',
      rockType: 'individual',
      quarter,
      year,
      status: 'on_track',
      dueDate: getQuarterEndDate(quarter, year),
      progress: 0,
      milestones: [
        { id: '3a', title: '5 avaliacoes', completed: false },
        { id: '3b', title: '10 avaliacoes', completed: false },
        { id: '3c', title: '15 avaliacoes', completed: false },
      ],
      statusHistory: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// Calculate progress based on milestones
function calculateProgress(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0;
  const completed = milestones.filter(m => m.completed).length;
  return Math.round((completed / milestones.length) * 100);
}

export interface UseRocksReturn {
  rocks: Rock[];
  isLoading: boolean;
  currentQuarter: number;
  currentYear: number;
  // CRUD operations
  addRock: (rock: Omit<Rock, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'progress'>) => void;
  updateRock: (id: string, updates: Partial<Rock>) => void;
  deleteRock: (id: string) => void;
  // Status operations
  updateStatus: (id: string, status: RockStatus, note?: string) => void;
  // Milestone operations
  toggleMilestone: (rockId: string, milestoneId: string) => void;
  addMilestone: (rockId: string, title: string) => void;
  deleteMilestone: (rockId: string, milestoneId: string) => void;
  // Filters
  getRocksByQuarter: (quarter: number, year: number) => Rock[];
  getRocksByOwner: (owner: string) => Rock[];
  getCompanyRocks: () => Rock[];
  getIndividualRocks: () => Rock[];
  getCurrentQuarterRocks: () => Rock[];
}

export function useRocks(): UseRocksReturn {
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load rocks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRocks(JSON.parse(stored));
      } else {
        const defaults = getDefaultRocks();
        setRocks(defaults);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      }
    } catch (error) {
      console.error('Error loading rocks:', error);
      setRocks(getDefaultRocks());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever rocks change
  const saveRocks = useCallback((newRocks: Rock[]) => {
    setRocks(newRocks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRocks));
  }, []);

  // Add a new rock
  const addRock = useCallback((rock: Omit<Rock, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'progress'>) => {
    const now = new Date().toISOString();
    const newRock: Rock = {
      ...rock,
      id: Date.now().toString(),
      progress: calculateProgress(rock.milestones || []),
      statusHistory: [],
      createdAt: now,
      updatedAt: now,
    };
    saveRocks([newRock, ...rocks]);
  }, [rocks, saveRocks]);

  // Update a rock
  const updateRock = useCallback((id: string, updates: Partial<Rock>) => {
    const newRocks = rocks.map(rock => {
      if (rock.id !== id) return rock;
      const updated = {
        ...rock,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      // Recalculate progress if milestones changed
      if (updates.milestones) {
        updated.progress = calculateProgress(updates.milestones);
      }
      return updated;
    });
    saveRocks(newRocks);
  }, [rocks, saveRocks]);

  // Delete a rock
  const deleteRock = useCallback((id: string) => {
    saveRocks(rocks.filter(rock => rock.id !== id));
  }, [rocks, saveRocks]);

  // Update status with history tracking
  const updateStatus = useCallback((id: string, newStatus: RockStatus, note?: string) => {
    const newRocks = rocks.map(rock => {
      if (rock.id !== id) return rock;

      const statusChange: StatusChange = {
        from: rock.status,
        to: newStatus,
        date: new Date().toISOString(),
        note,
      };

      return {
        ...rock,
        status: newStatus,
        statusHistory: [...rock.statusHistory, statusChange],
        updatedAt: new Date().toISOString(),
      };
    });
    saveRocks(newRocks);
  }, [rocks, saveRocks]);

  // Toggle milestone completion
  const toggleMilestone = useCallback((rockId: string, milestoneId: string) => {
    const newRocks = rocks.map(rock => {
      if (rock.id !== rockId) return rock;

      const newMilestones = rock.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );

      return {
        ...rock,
        milestones: newMilestones,
        progress: calculateProgress(newMilestones),
        updatedAt: new Date().toISOString(),
      };
    });
    saveRocks(newRocks);
  }, [rocks, saveRocks]);

  // Add milestone
  const addMilestone = useCallback((rockId: string, title: string) => {
    const newRocks = rocks.map(rock => {
      if (rock.id !== rockId) return rock;

      const newMilestone: Milestone = {
        id: `${rockId}-${Date.now()}`,
        title,
        completed: false,
      };

      const newMilestones = [...rock.milestones, newMilestone];

      return {
        ...rock,
        milestones: newMilestones,
        progress: calculateProgress(newMilestones),
        updatedAt: new Date().toISOString(),
      };
    });
    saveRocks(newRocks);
  }, [rocks, saveRocks]);

  // Delete milestone
  const deleteMilestone = useCallback((rockId: string, milestoneId: string) => {
    const newRocks = rocks.map(rock => {
      if (rock.id !== rockId) return rock;

      const newMilestones = rock.milestones.filter(m => m.id !== milestoneId);

      return {
        ...rock,
        milestones: newMilestones,
        progress: calculateProgress(newMilestones),
        updatedAt: new Date().toISOString(),
      };
    });
    saveRocks(newRocks);
  }, [rocks, saveRocks]);

  // Filter functions
  const getRocksByQuarter = useCallback((quarter: number, year: number) => {
    return rocks.filter(r => r.quarter === quarter && r.year === year);
  }, [rocks]);

  const getRocksByOwner = useCallback((owner: string) => {
    return rocks.filter(r => r.owner === owner);
  }, [rocks]);

  const getCompanyRocks = useCallback(() => {
    return rocks.filter(r => r.rockType === 'company');
  }, [rocks]);

  const getIndividualRocks = useCallback(() => {
    return rocks.filter(r => r.rockType === 'individual');
  }, [rocks]);

  const getCurrentQuarterRocks = useCallback(() => {
    return rocks.filter(r => r.quarter === getCurrentQuarter() && r.year === getCurrentYear());
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
  };
}

// Export helper functions for use elsewhere
export { getCurrentQuarter, getCurrentYear, getQuarterEndDate };

// OS Template Types
// Templates allow saving default configurations for work orders

import { WorkOrderRoom, WorkOrderTask, WorkOrderMaterial } from './work-order';

export interface OSTemplate {
  id: string;
  organizationId: string;

  // Template info
  name: string;
  description?: string;

  // Default configuration
  rooms: Omit<WorkOrderRoom, 'id' | 'completed'>[];
  tasks: Omit<WorkOrderTask, 'id' | 'completed' | 'completedAt' | 'completedBy'>[];
  materials: Omit<WorkOrderMaterial, 'id'>[];

  // Settings
  estimatedDuration: number | null;  // hours
  isDefault: boolean;

  createdAt: string;
  updatedAt: string;
}

// Template for creating a new template
export type OSTemplateInput = Omit<OSTemplate, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>;

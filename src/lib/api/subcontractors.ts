import { api } from './client';

export interface Subcontractor {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  specialty: 'interior' | 'exterior' | 'both';
  defaultPayoutPct: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubcontractorRequest {
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  specialty?: 'interior' | 'exterior' | 'both';
  defaultPayoutPct?: number;
}

export interface UpdateSubcontractorRequest extends Partial<CreateSubcontractorRequest> {
  isActive?: boolean;
}

export const subcontractorsApi = {
  // Get all subcontractors
  async list(params?: { specialty?: string; isActive?: boolean }) {
    const query = new URLSearchParams();
    if (params?.specialty) query.set('specialty', params.specialty);
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    const queryString = query.toString();
    return api.get<Subcontractor[]>(`/subcontractors${queryString ? `?${queryString}` : ''}`);
  },

  // Get single subcontractor
  async get(id: string) {
    return api.get<Subcontractor>(`/subcontractors/${id}`);
  },

  // Create subcontractor
  async create(data: CreateSubcontractorRequest) {
    return api.post<Subcontractor>('/subcontractors', data);
  },

  // Update subcontractor
  async update(id: string, data: UpdateSubcontractorRequest) {
    return api.patch<Subcontractor>(`/subcontractors/${id}`, data);
  },

  // Delete subcontractor
  async delete(id: string) {
    return api.delete<{ message: string }>(`/subcontractors/${id}`);
  },
};

import { api } from './client';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  source: string;
  status: 'new' | 'contacted' | 'estimate_scheduled' | 'estimated' | 'proposal_sent' | 'follow_up' | 'won' | 'lost';
  projectType: 'interior' | 'exterior' | 'both';
  leadDate: string;
  nextFollowupDate?: string;
  estimatedJobValue?: number;
  wonLostReason?: string;
  notes?: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  source: string;
  projectType?: 'interior' | 'exterior' | 'both';
  estimatedJobValue?: number;
  notes?: string;
  assignedToId?: string;
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  status?: Lead['status'];
  nextFollowupDate?: string;
  wonLostReason?: string;
}

export const leadsApi = {
  // Get all leads
  async list(params?: { status?: string; source?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.source) query.set('source', params.source);
    if (params?.search) query.set('search', params.search);
    const queryString = query.toString();
    return api.get<Lead[]>(`/leads${queryString ? `?${queryString}` : ''}`);
  },

  // Get single lead
  async get(id: string) {
    return api.get<Lead>(`/leads/${id}`);
  },

  // Create lead
  async create(data: CreateLeadRequest) {
    return api.post<Lead>('/leads', data);
  },

  // Update lead
  async update(id: string, data: UpdateLeadRequest) {
    return api.patch<Lead>(`/leads/${id}`, data);
  },

  // Delete lead
  async delete(id: string) {
    return api.delete<{ message: string }>(`/leads/${id}`);
  },

  // Get lead sources (for dropdowns)
  async getSources() {
    return api.get<string[]>('/leads/sources');
  },
};

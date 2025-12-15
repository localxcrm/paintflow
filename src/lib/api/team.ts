import { api } from './client';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'sales' | 'pm' | 'both';
  defaultCommissionPct: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberRequest {
  name: string;
  email: string;
  phone?: string;
  role?: 'sales' | 'pm' | 'both';
  defaultCommissionPct?: number;
}

export interface UpdateTeamMemberRequest extends Partial<CreateTeamMemberRequest> {
  isActive?: boolean;
}

export const teamApi = {
  // Get all team members
  async list(params?: { role?: string; isActive?: boolean }) {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    const queryString = query.toString();
    return api.get<TeamMember[]>(`/team${queryString ? `?${queryString}` : ''}`);
  },

  // Get single team member
  async get(id: string) {
    return api.get<TeamMember>(`/team/${id}`);
  },

  // Create team member
  async create(data: CreateTeamMemberRequest) {
    return api.post<TeamMember>('/team', data);
  },

  // Update team member
  async update(id: string, data: UpdateTeamMemberRequest) {
    return api.patch<TeamMember>(`/team/${id}`, data);
  },

  // Delete team member
  async delete(id: string) {
    return api.delete<{ message: string }>(`/team/${id}`);
  },

  // Get sales reps (for dropdowns)
  async getSalesReps() {
    return api.get<TeamMember[]>('/team?role=sales');
  },

  // Get project managers (for dropdowns)
  async getProjectManagers() {
    return api.get<TeamMember[]>('/team?role=pm');
  },
};

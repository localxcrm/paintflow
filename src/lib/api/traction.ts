import { api } from './client';

// VTO Types
export interface VTO {
  id: string;
  coreValues: string[];
  coreFocusPurpose: string;
  coreFocusNiche: string;
  tenYearTarget: string;
  threeYearRevenue: number;
  threeYearProfit: number;
  threeYearPicture: string;
  oneYearRevenue: number;
  oneYearProfit: number;
  oneYearGoals: string[];
  targetMarket: string;
  threeUniques: string[];
  provenProcess: string;
  guarantee: string;
  longTermIssues: string[];
  createdAt: string;
  updatedAt: string;
}

// Rock Types
export interface Rock {
  id: string;
  title: string;
  description?: string;
  owner: string;
  rockType: 'company' | 'individual';
  quarter: number;
  year: number;
  status: 'on_track' | 'off_track' | 'complete' | 'dropped';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

// Todo Types
export interface Todo {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: 'pending' | 'done';
  createdAt: string;
  updatedAt: string;
}

// Issue Types
export interface Issue {
  id: string;
  title: string;
  description?: string;
  issueType: 'short_term' | 'long_term';
  priority: number;
  status: 'open' | 'in_discussion' | 'solved';
  createdBy: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

// Scorecard Types
export interface ScorecardMetric {
  id: string;
  name: string;
  owner: string;
  goalValue: number;
  goalType: 'number' | 'currency' | 'percent';
  goalDirection: 'above' | 'below';
  category: 'leading' | 'lagging';
  entries: ScorecardEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ScorecardEntry {
  id: string;
  weekEndingDate: string;
  actualValue: number;
  onTrack: boolean;
  metricId: string;
  createdAt: string;
}

// Meeting Types
export interface Meeting {
  id: string;
  meetingDate: string;
  meetingType: 'l10' | 'quarterly' | 'annual';
  attendees: string[];
  ratingAvg: number;
  segueNotes?: string;
  headlines?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const tractionApi = {
  // VTO
  vto: {
    async get() {
      return api.get<VTO>('/traction/vto');
    },
    async update(data: Partial<VTO>) {
      return api.patch<VTO>('/traction/vto', data);
    },
  },

  // Rocks
  rocks: {
    async list(params?: { quarter?: number; year?: number; owner?: string; status?: string }) {
      const query = new URLSearchParams();
      if (params?.quarter) query.set('quarter', String(params.quarter));
      if (params?.year) query.set('year', String(params.year));
      if (params?.owner) query.set('owner', params.owner);
      if (params?.status) query.set('status', params.status);
      const queryString = query.toString();
      return api.get<Rock[]>(`/traction/rocks${queryString ? `?${queryString}` : ''}`);
    },
    async create(data: Omit<Rock, 'id' | 'createdAt' | 'updatedAt'>) {
      return api.post<Rock>('/traction/rocks', data);
    },
    async update(id: string, data: Partial<Rock>) {
      return api.patch<Rock>(`/traction/rocks/${id}`, data);
    },
    async delete(id: string) {
      return api.delete<{ message: string }>(`/traction/rocks/${id}`);
    },
  },

  // Todos
  todos: {
    async list(params?: { owner?: string; status?: string }) {
      const query = new URLSearchParams();
      if (params?.owner) query.set('owner', params.owner);
      if (params?.status) query.set('status', params.status);
      const queryString = query.toString();
      return api.get<Todo[]>(`/traction/todos${queryString ? `?${queryString}` : ''}`);
    },
    async create(data: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) {
      return api.post<Todo>('/traction/todos', data);
    },
    async update(id: string, data: Partial<Todo>) {
      return api.patch<Todo>(`/traction/todos/${id}`, data);
    },
    async delete(id: string) {
      return api.delete<{ message: string }>(`/traction/todos/${id}`);
    },
  },

  // Issues
  issues: {
    async list(params?: { issueType?: string; status?: string }) {
      const query = new URLSearchParams();
      if (params?.issueType) query.set('issueType', params.issueType);
      if (params?.status) query.set('status', params.status);
      const queryString = query.toString();
      return api.get<Issue[]>(`/traction/issues${queryString ? `?${queryString}` : ''}`);
    },
    async create(data: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) {
      return api.post<Issue>('/traction/issues', data);
    },
    async update(id: string, data: Partial<Issue>) {
      return api.patch<Issue>(`/traction/issues/${id}`, data);
    },
    async delete(id: string) {
      return api.delete<{ message: string }>(`/traction/issues/${id}`);
    },
  },

  // Scorecard
  scorecard: {
    async list() {
      return api.get<ScorecardMetric[]>('/traction/scorecard');
    },
    async createMetric(data: Omit<ScorecardMetric, 'id' | 'entries' | 'createdAt' | 'updatedAt'>) {
      return api.post<ScorecardMetric>('/traction/scorecard', data);
    },
    async updateMetric(id: string, data: Partial<ScorecardMetric>) {
      return api.patch<ScorecardMetric>(`/traction/scorecard/${id}`, data);
    },
    async deleteMetric(id: string) {
      return api.delete<{ message: string }>(`/traction/scorecard/${id}`);
    },
    async addEntry(metricId: string, data: { weekEndingDate: string; actualValue: number }) {
      return api.post<ScorecardEntry>(`/traction/scorecard/${metricId}/entries`, data);
    },
  },

  // Meetings
  meetings: {
    async list(params?: { meetingType?: string }) {
      const query = params?.meetingType ? `?meetingType=${params.meetingType}` : '';
      return api.get<Meeting[]>(`/traction/meetings${query}`);
    },
    async get(id: string) {
      return api.get<Meeting>(`/traction/meetings/${id}`);
    },
    async create(data: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) {
      return api.post<Meeting>('/traction/meetings', data);
    },
    async update(id: string, data: Partial<Meeting>) {
      return api.patch<Meeting>(`/traction/meetings/${id}`, data);
    },
    async delete(id: string) {
      return api.delete<{ message: string }>(`/traction/meetings/${id}`);
    },
  },
};

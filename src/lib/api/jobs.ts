import { api } from './client';

export interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  address: string;
  city: string;
  projectType: 'interior' | 'exterior' | 'both';
  status: 'lead' | 'got_the_job' | 'scheduled' | 'completed';
  jobDate: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  jobValue: number;
  subMaterials: number;
  subLabor: number;
  subTotal: number;
  grossProfit: number;
  grossMarginPct: number;
  depositRequired: number;
  depositPaid: boolean;
  jobPaid: boolean;
  balanceDue: number;
  invoiceDate?: string;
  paymentReceivedDate?: string;
  daysToCollect?: number;
  salesCommissionPct: number;
  salesCommissionAmount: number;
  salesCommissionPaid: boolean;
  pmCommissionPct: number;
  pmCommissionAmount: number;
  pmCommissionPaid: boolean;
  subcontractorPrice: number;
  subcontractorPaid: boolean;
  meetsMinGp: boolean;
  meetsTargetGm: boolean;
  profitFlag: 'OK' | 'RAISE_PRICE' | 'FIX_SCOPE';
  notes?: string;
  leadId?: string;
  estimateId?: string;
  salesRepId?: string;
  salesRep?: { id: string; name: string };
  projectManagerId?: string;
  projectManager?: { id: string; name: string };
  subcontractorId?: string;
  subcontractor?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  clientName: string;
  address: string;
  city: string;
  projectType?: 'interior' | 'exterior' | 'both';
  jobValue: number;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  notes?: string;
  leadId?: string;
  estimateId?: string;
  salesRepId?: string;
  projectManagerId?: string;
  subcontractorId?: string;
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: Job['status'];
  actualStartDate?: string;
  actualEndDate?: string;
  depositPaid?: boolean;
  jobPaid?: boolean;
  invoiceDate?: string;
  paymentReceivedDate?: string;
  salesCommissionPaid?: boolean;
  pmCommissionPaid?: boolean;
  subcontractorPaid?: boolean;
}

export const jobsApi = {
  // Get all jobs
  async list(params?: { status?: string; search?: string; projectType?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.projectType) query.set('projectType', params.projectType);
    const queryString = query.toString();
    return api.get<Job[]>(`/jobs${queryString ? `?${queryString}` : ''}`);
  },

  // Get single job
  async get(id: string) {
    return api.get<Job>(`/jobs/${id}`);
  },

  // Create job
  async create(data: CreateJobRequest) {
    return api.post<Job>('/jobs', data);
  },

  // Update job
  async update(id: string, data: UpdateJobRequest) {
    return api.patch<Job>(`/jobs/${id}`, data);
  },

  // Delete job
  async delete(id: string) {
    return api.delete<{ message: string }>(`/jobs/${id}`);
  },

  // Get job statistics
  async getStats() {
    return api.get<{
      total: number;
      byStatus: Record<string, number>;
      totalValue: number;
      totalProfit: number;
    }>('/jobs/stats');
  },

  // Mark deposit as paid
  async markDepositPaid(id: string) {
    return api.patch<Job>(`/jobs/${id}`, { depositPaid: true });
  },

  // Mark job as paid
  async markJobPaid(id: string) {
    return api.patch<Job>(`/jobs/${id}`, {
      jobPaid: true,
      paymentReceivedDate: new Date().toISOString()
    });
  },
};

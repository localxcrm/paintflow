import { api } from './client';

export interface EstimateLineItem {
  id?: string;
  description: string;
  location: string;
  scope?: 'walls_only' | 'walls_trim' | 'walls_trim_ceiling' | 'full_refresh';
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface EstimateSignature {
  id: string;
  clientName: string;
  signatureDataUrl: string;
  signedAt: string;
  ipAddress?: string;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  clientName: string;
  address: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  estimateDate: string;
  validUntil: string;
  subtotal: number;
  discountAmount: number;
  totalPrice: number;
  subMaterialsCost: number;
  subLaborCost: number;
  subTotalCost: number;
  grossProfit: number;
  grossMarginPct: number;
  meetsMinGp: boolean;
  meetsTargetGm: boolean;
  notes?: string;
  leadId?: string;
  lineItems: EstimateLineItem[];
  signature?: EstimateSignature;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEstimateRequest {
  clientName: string;
  address: string;
  leadId?: string;
  validUntil?: string;
  discountAmount?: number;
  notes?: string;
  lineItems: Omit<EstimateLineItem, 'id'>[];
}

export interface UpdateEstimateRequest extends Partial<CreateEstimateRequest> {
  status?: Estimate['status'];
}

export interface SignEstimateRequest {
  clientName: string;
  signatureDataUrl: string;
}

export const estimatesApi = {
  // Get all estimates
  async list(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const queryString = query.toString();
    return api.get<Estimate[]>(`/estimates${queryString ? `?${queryString}` : ''}`);
  },

  // Get single estimate
  async get(id: string) {
    return api.get<Estimate>(`/estimates/${id}`);
  },

  // Create estimate
  async create(data: CreateEstimateRequest) {
    return api.post<Estimate>('/estimates', data);
  },

  // Update estimate
  async update(id: string, data: UpdateEstimateRequest) {
    return api.patch<Estimate>(`/estimates/${id}`, data);
  },

  // Delete estimate
  async delete(id: string) {
    return api.delete<{ message: string }>(`/estimates/${id}`);
  },

  // Sign estimate
  async sign(id: string, data: SignEstimateRequest) {
    return api.post<{ estimate: Estimate; message: string }>(`/estimates/${id}/sign`, data);
  },

  // Convert estimate to job
  async convertToJob(id: string) {
    return api.post<{ job: unknown; message: string }>(`/estimates/${id}/convert-to-job`);
  },

  // Preview estimate (for PDF generation)
  async preview(id: string) {
    return api.get<{ html: string }>(`/estimates/${id}/preview`);
  },
};

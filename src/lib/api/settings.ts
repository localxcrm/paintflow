import { api } from './client';

export interface BusinessSettings {
  id: string;
  subPayoutPct: number;
  subMaterialsPct: number;
  subLaborPct: number;
  minGrossProfitPerJob: number;
  targetGrossMarginPct: number;
  defaultDepositPct: number;
  arTargetDays: number;
  priceRoundingIncrement: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyEstimateSettings {
  id: string;
  insuranceCertificateUrl?: string;
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceCoverageAmount?: number;
  insuranceExpirationDate?: string;
  licenseImageUrl?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpirationDate?: string;
  termsAndConditions: string;
  paymentTerms?: string;
  warrantyTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioImage {
  id: string;
  beforeUrl: string;
  afterUrl: string;
  projectType: 'interior' | 'exterior' | 'both';
  description?: string;
  createdAt: string;
}

export const settingsApi = {
  // Business Settings
  business: {
    async get() {
      return api.get<BusinessSettings>('/settings/business');
    },
    async update(data: Partial<BusinessSettings>) {
      return api.patch<BusinessSettings>('/settings/business', data);
    },
  },

  // Company Estimate Settings
  estimateSettings: {
    async get() {
      return api.get<CompanyEstimateSettings>('/settings/estimate-settings');
    },
    async update(data: Partial<CompanyEstimateSettings>) {
      return api.patch<CompanyEstimateSettings>('/settings/estimate-settings', data);
    },
  },

  // Portfolio
  portfolio: {
    async list() {
      return api.get<PortfolioImage[]>('/settings/portfolio');
    },
    async create(data: Omit<PortfolioImage, 'id' | 'createdAt'>) {
      return api.post<PortfolioImage>('/settings/portfolio', data);
    },
    async delete(id: string) {
      return api.delete<{ message: string }>(`/settings/portfolio/${id}`);
    },
  },
};

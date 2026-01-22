import type {
  Subcontractor,
  SubcontractorPayout,
  SubcontractorPayment,
  Job,
  TimeEntry,
  SubcontractorEmployee,
  JobMaterialCost,
} from './database';

// ============================================
// FINANCIAL MODULE TYPES
// ============================================

/**
 * Summary row for list view (FIN-01, FIN-02)
 * Used in admin financial dashboard to display subcontractor earnings overview
 */
export interface SubcontractorFinancialSummary {
  id: string;
  name: string;
  companyName: string | null;
  email: string;
  defaultPayoutPct: number;
  isActive: boolean;
  totalEarnings: number;
  totalPaid: number;
  pendingAmount: number;
  jobsCompleted: number;
}

/**
 * Payout with job and payments for detail view
 * Extends SubcontractorPayout with related Job and SubcontractorPayment data
 */
export interface PayoutWithDetails extends SubcontractorPayout {
  Job: Pick<Job, 'id' | 'jobNumber' | 'clientName' | 'address' | 'jobDate' | 'status'>;
  SubcontractorPayment: SubcontractorPayment[];
}

/**
 * Full detail for /financeiro/[id] page (FIN-04)
 * Complete financial breakdown for a single subcontractor
 */
export interface SubcontractorFinancialDetail extends Subcontractor {
  payouts: PayoutWithDetails[];
  totalEarnings: number;
  totalPaid: number;
  pendingAmount: number;
}

/**
 * Time entry with employee for cost breakdown display
 * Used to show labor costs with employee details
 */
export interface TimeEntryWithEmployee extends TimeEntry {
  SubcontractorEmployee: Pick<SubcontractorEmployee, 'id' | 'name' | 'hourlyRate'>;
}

/**
 * Cost detail for a job (employees + materials)
 * Provides complete cost breakdown for a specific job
 */
export interface JobCostDetail {
  jobId: string;
  timeEntries: TimeEntryWithEmployee[];
  materialCost: JobMaterialCost | null;
  totalLaborCost: number;
  totalMaterialCost: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Response from GET /api/admin/subcontractor-financials
 * Returns list of all subcontractors with financial summaries
 */
export interface SubcontractorFinancialsListResponse {
  subcontractors: SubcontractorFinancialSummary[];
}

/**
 * Response from GET /api/admin/subcontractor-financials/[id]
 * Returns detailed financial data for a single subcontractor
 */
export interface SubcontractorFinancialDetailResponse {
  subcontractor: SubcontractorFinancialDetail;
  jobCosts: Record<string, JobCostDetail>;
}

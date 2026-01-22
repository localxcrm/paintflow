import type {
  SubcontractorEmployee,
  TimeEntry,
  JobMaterialCost,
} from './database';

// ============================================
// SUB PORTAL FINANCIAL TYPES
// ============================================

/**
 * Summary data for subcontractor dashboard cards
 * Aggregates earnings, pending amounts, and payments
 */
export interface SubEarningsSummary {
  totalEarnings: number;      // SUM of finalPayout from paid payouts
  totalPending: number;       // SUM of finalPayout from pending payouts
  totalPaid: number;          // SUM of payment amounts with status='paid'
  jobCount: number;           // Count of jobs with payouts
  avgProfitPerJob: number;    // Average profit across jobs
  // Owner effective rate (only if owner works)
  ownerHoursTotal: number | null;
  effectiveRateOverall: number | null;
}

/**
 * Financial data for a single job in earnings table
 * Shows earnings, costs, profit, and payment status
 */
export interface SubJobFinancial {
  jobId: string;
  jobNumber: string;
  clientName: string;
  address: string;
  completedDate: string | null;
  earnings: number;           // finalPayout from SubcontractorPayout
  laborCost: number;          // calculated from time entries
  materialCost: number;       // from JobMaterialCost
  profit: number;             // earnings - laborCost - materialCost
  profitMargin: number;       // (profit / earnings) * 100
  paymentStatus: 'paid' | 'pending' | 'partial';
  ownerHours: number | null;  // hours where employee.isOwner = true
  effectiveRate: number | null; // profit / ownerHours
}

/**
 * Time entry with employee and job details for display
 * Used in time entry lists and job detail pages
 */
export interface TimeEntryWithEmployee {
  id: string;
  workDate: string;
  hoursWorked: number;
  notes: string | null;
  employee: {
    id: string;
    name: string;
    hourlyRate: number;
    isOwner: boolean;
  };
  job: {
    id: string;
    jobNumber: string;
    clientName: string;
  };
  laborCost: number; // hoursWorked * hourlyRate
}

/**
 * Employee with statistics for list view
 * Includes total hours worked and earnings
 */
export interface EmployeeWithStats {
  id: string;
  name: string;
  hourlyRate: number;
  isActive: boolean;
  isOwner: boolean;
  ssn: string | null;
  phone: string | null;
  totalHours: number;
  totalEarned: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Response from GET /api/sub/financials
 * Returns earnings summary and job list
 */
export interface SubFinancialsResponse {
  summary: SubEarningsSummary;
  jobs: SubJobFinancial[];
}

/**
 * Response from GET /api/sub/financials/[jobId]
 * Returns detailed job profit breakdown
 */
export interface SubJobDetailResponse {
  job: SubJobFinancial;
  timeEntries: TimeEntryWithEmployee[];
  materialCost: { totalCost: number; notes: string | null } | null;
}

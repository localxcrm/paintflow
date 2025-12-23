// Business Types
export interface BusinessSettings {
  subPayoutPct: number;
  subMaterialsPct: number;
  subLaborPct: number;
  minGrossProfitPerJob: number;
  targetGrossMarginPct: number;
  defaultDepositPct: number;
  arTargetDays: number;
  priceRoundingIncrement: number;
}

// Lead/CRM Types
export type LeadStatus = 'new' | 'contacted' | 'estimate_scheduled' | 'estimated' | 'proposal_sent' | 'follow_up' | 'won' | 'lost';
export type ProjectType = 'interior' | 'exterior' | 'both';

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
  status: LeadStatus;
  leadDate: string;
  nextFollowupDate?: string;
  estimatedJobValue?: number;
  wonLostReason?: string;
  assignedTo?: string;
  projectType: ProjectType;
  notes?: string;
}

// Estimate Types
export type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
export type Scope = 'walls_only' | 'walls_trim' | 'walls_trim_ceiling' | 'full_refresh';

export interface EstimateLineItem {
  id: string;
  description: string;
  location: string;
  scope?: Scope;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  leadId?: string;
  clientName: string;
  address: string;
  status: EstimateStatus;
  estimateDate: string;
  validUntil: string;
  lineItems: EstimateLineItem[];
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
}

// Team Member Types
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'sales' | 'pm' | 'both';
  defaultCommissionPct: number;
  isActive: boolean;
}

// Subcontractor Types
export interface Subcontractor {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  specialty: 'interior' | 'exterior' | 'both';
  defaultPayoutPct: number;
  isActive: boolean;
}

// Job Types
export type JobStatus = 'lead' | 'got_the_job' | 'scheduled' | 'completed';
export type ProfitFlag = 'OK' | 'RAISE PRICE' | 'FIX SCOPE';
export type PaymentStatus = 'all' | 'deposit_pending' | 'job_unpaid' | 'fully_paid';
export type PaymentMethod = 'cash' | 'check' | 'venmo' | 'zelle' | 'credit_card' | 'bank_transfer' | 'other';

export interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  projectType: ProjectType;
  status: JobStatus;
  jobDate: string;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;

  // Job Value (drives all calculations)
  jobValue: number;

  // Auto-calculated from job value
  subMaterials: number;
  subLabor: number;
  subTotal: number;
  grossProfit: number;
  grossMarginPct: number;

  // People Assignment
  salesRepId?: string;
  salesRep?: TeamMember;
  projectManagerId?: string;
  projectManager?: TeamMember;
  subcontractorId?: string;
  subcontractor?: Subcontractor;

  // Client Payment Tracking
  depositRequired: number;
  depositPaid: boolean;
  depositPaymentMethod?: PaymentMethod;
  depositPaymentDate?: string;
  jobPaid: boolean;
  jobPaymentMethod?: PaymentMethod;
  jobPaymentDate?: string;
  balanceDue: number;
  invoiceDate?: string;
  paymentReceivedDate?: string;
  daysToCollect?: number;

  // Sales Commission
  salesCommissionPct: number;
  salesCommissionAmount: number;
  salesCommissionPaid: boolean;

  // PM Commission
  pmCommissionPct: number;
  pmCommissionAmount: number;
  pmCommissionPaid: boolean;

  // Subcontractor Payment
  subcontractorPrice: number;
  subcontractorPaid: boolean;

  // Profit Flags
  meetsMinGp: boolean;
  meetsTargetGm: boolean;
  profitFlag: ProfitFlag;

  // Notes and Comments
  notes?: string;

  // Photos (before/after)
  photos?: JobPhoto[];

  // Payment History
  paymentHistory?: PaymentHistoryItem[];

  // Legacy field (keep for backward compatibility)
  crewLeader?: string;
  invoiceAmount?: number; // Alias for jobValue
}

// Job Photo
export interface JobPhoto {
  id: string;
  url: string;
  type: 'before' | 'after' | 'progress';
  description?: string;
  uploadedAt: string;
}

// Payment History Item
export interface PaymentHistoryItem {
  id: string;
  date: string;
  type: 'deposit' | 'final_payment' | 'sales_commission' | 'pm_commission' | 'subcontractor';
  method: PaymentMethod;
  amount: number;
  notes?: string;
}

// Job KPI Summary Types
export interface JobKPIs {
  totalJobValue: number;
  averageJobValue: number;
  jobCount: number;
  totalGrossProfit: number;
  salesCommissionsPending: number;
  salesCommissionsPaid: number;
  pmCommissionsPending: number;
  pmCommissionsPaid: number;
  subcontractorPending: number;
  subcontractorPaid: number;
}

// Price Book Types
export interface RoomPrice {
  id: string;
  roomType: string;
  size: string;
  typicalSqft: number;
  wallsOnly: number;
  wallsTrim: number;
  wallsTrimCeiling: number;
  fullRefresh: number;
}

export interface ExteriorPrice {
  id: string;
  surfaceType: string;
  pricePerSqft: number;
  prepMultiplier: number;
}

export interface Addon {
  id: string;
  name: string;
  category: 'interior' | 'exterior' | 'both';
  unit: string;
  basePrice: number;
}

// EOS/Traction Types
export interface VTO {
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
}

export interface ScorecardMetric {
  id: string;
  name: string;
  owner: string;
  goalValue: number;
  goalType: 'number' | 'currency' | 'percent';
  goalDirection: 'above' | 'below';
  category: 'leading' | 'lagging';
  entries: ScorecardEntry[];
}

export interface ScorecardEntry {
  weekEndingDate: string;
  actualValue: number;
  onTrack: boolean;
}

export type RockStatus = 'on_track' | 'off_track' | 'complete' | 'dropped';

export interface Rock {
  id: string;
  title: string;
  description?: string;
  owner: string;
  rockType: 'company' | 'individual';
  quarter: number;
  year: number;
  status: RockStatus;
  dueDate: string;
}

export interface Todo {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: 'pending' | 'done';
  createdAt: string;
}

export type IssuePriority = 1 | 2 | 3;
export type IssueStatus = 'open' | 'in_discussion' | 'solved';

export interface Issue {
  id: string;
  title: string;
  description?: string;
  issueType: 'short_term' | 'long_term';
  priority: IssuePriority;
  status: IssueStatus;
  createdBy: string;
  createdAt: string;
  resolution?: string;
}

export interface Seat {
  id: string;
  seatName: string;
  roleDescription: string;
  responsibilities: string[];
  personName?: string;
  personId?: string;
  reportsToId?: string;
  gwcGetsIt: boolean;
  gwcWantsIt: boolean;
  gwcCapacity: boolean;
  isRightPersonRightSeat: boolean;
}

export interface Meeting {
  id: string;
  meetingDate: string;
  meetingType: 'l10' | 'quarterly' | 'annual';
  attendees: string[];
  ratingAvg: number;
  segueNotes?: string;
  headlines?: string;
  notes?: string;
}

export interface PeopleAnalyzer {
  id: string;
  personName: string;
  personId: string;
  reviewDate: string;
  coreValueRatings: Record<string, '+' | '+/-' | '-'>;
  gwcRating: {
    getsIt: boolean;
    wantsIt: boolean;
    capacity: boolean;
  };
  overallStatus: 'right_person_right_seat' | 'needs_work' | 'wrong_fit';
  notes?: string;
}

// Dashboard KPI Types
export interface DashboardKPIs {
  revenueYTD: number;
  grossMarginPct: number;
  netMarginPct: number;
  jobsCount: number;
  avgJobSize: number;
  avgGpPerJob: number;
  avgDaysToCollect: number;
  flaggedJobsCount: number;
  leadsYTD: number;
  closeRate: number;
}

export interface MonthlyKPI {
  month: string;
  leads: number;
  estimatesSent: number;
  jobsInvoiced: number;
  closeRate: number;
  revenue: number;
  grossProfit: number;
  grossMarginPct: number;
  netProfit: number;
}

// Company Estimate Settings Types
export interface PortfolioImage {
  id: string;
  beforeUrl: string;
  afterUrl: string;
  projectType: ProjectType;
  description?: string;
}

export interface CompanyEstimateSettings {
  // Insurance
  insuranceCertificateUrl?: string;
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceCoverageAmount?: number;
  insuranceExpirationDate?: string;

  // License
  licenseImageUrl?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpirationDate?: string;

  // Portfolio (Before & Afters)
  portfolioImages: PortfolioImage[];

  // Terms & Conditions
  termsAndConditions: string;
  paymentTerms?: string;
  warrantyTerms?: string;
}

// Estimate Signature Types
export interface EstimateSignature {
  clientName: string;
  signatureDataUrl: string;
  signedAt: string;
  ipAddress?: string;
}

// AI Assistant Message Types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedLineItems?: EstimateLineItem[];
  suggestedRiskModifiers?: string[];
}

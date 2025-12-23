// Database types for Supabase
// Auto-generated from Prisma schema

// ============================================
// ENUMS
// ============================================

export type UserRole = 'admin' | 'user' | 'viewer';
export type TeamRole = 'sales' | 'pm' | 'both';
export type SubcontractorType = 'interior' | 'exterior' | 'both';
export type LeadStatus = 'new' | 'contacted' | 'estimate_scheduled' | 'estimated' | 'proposal_sent' | 'follow_up' | 'won' | 'lost';
export type ProjectType = 'interior' | 'exterior' | 'both';
export type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
export type Scope = 'walls_only' | 'walls_trim' | 'walls_trim_ceiling' | 'full_refresh';
export type JobStatus = 'lead' | 'got_the_job' | 'scheduled' | 'completed';
export type ProfitFlag = 'OK' | 'RAISE_PRICE' | 'FIX_SCOPE';
export type AddonCategory = 'interior' | 'exterior' | 'both';
export type RockType = 'company' | 'individual';
export type RockStatus = 'on_track' | 'off_track' | 'complete' | 'dropped';
export type TodoStatus = 'pending' | 'done';
export type IssueType = 'short_term' | 'long_term';
export type IssueStatus = 'open' | 'in_discussion' | 'solved';
export type MeetingType = 'l10' | 'quarterly' | 'annual';
export type GoalType = 'number' | 'currency' | 'percent';
export type GoalDirection = 'above' | 'below';
export type MetricCategory = 'leading' | 'lagging';
export type PersonStatus = 'right_person_right_seat' | 'needs_work' | 'wrong_fit';
export type AIRole = 'user' | 'assistant';

// ============================================
// DATABASE MODELS
// ============================================

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  userId: string;
}

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

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: TeamRole;
  defaultCommissionPct: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subcontractor {
  id: string;
  name: string;
  companyName: string | null;
  email: string;
  phone: string | null;
  specialty: SubcontractorType;
  defaultPayoutPct: number;
  isActive: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

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
  projectType: ProjectType;
  leadDate: string;
  nextFollowupDate: string | null;
  estimatedJobValue: number | null;
  wonLostReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToId: string | null;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  clientName: string;
  address: string;
  status: EstimateStatus;
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
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  leadId: string | null;
}

export interface EstimateLineItem {
  id: string;
  description: string;
  location: string;
  scope: Scope | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  estimateId: string;
}

export interface EstimateSignature {
  id: string;
  clientName: string;
  signatureDataUrl: string;
  signedAt: string;
  ipAddress: string | null;
  estimateId: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  clientName: string;
  address: string;
  city: string;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  projectType: ProjectType;
  status: JobStatus;
  jobDate: string;
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
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
  invoiceDate: string | null;
  paymentReceivedDate: string | null;
  daysToCollect: number | null;
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
  profitFlag: ProfitFlag;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  leadId: string | null;
  estimateId: string | null;
  salesRepId: string | null;
  projectManagerId: string | null;
  subcontractorId: string | null;
}

export interface RoomPrice {
  id: string;
  roomType: string;
  size: string;
  typicalSqft: number;
  wallsOnly: number;
  wallsTrim: number;
  wallsTrimCeiling: number;
  fullRefresh: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExteriorPrice {
  id: string;
  surfaceType: string;
  pricePerSqft: number;
  prepMultiplier: number;
  createdAt: string;
  updatedAt: string;
}

export interface Addon {
  id: string;
  name: string;
  category: AddonCategory;
  unit: string;
  basePrice: number;
  createdAt: string;
  updatedAt: string;
}

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

export interface Rock {
  id: string;
  title: string;
  description: string | null;
  owner: string;
  rockType: RockType;
  quarter: number;
  year: number;
  status: RockStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  issueType: IssueType;
  priority: number;
  status: IssueStatus;
  createdBy: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  id: string;
  seatName: string;
  roleDescription: string;
  responsibilities: string[];
  personName: string | null;
  personId: string | null;
  reportsToId: string | null;
  gwcGetsIt: boolean;
  gwcWantsIt: boolean;
  gwcCapacity: boolean;
  isRightPersonRightSeat: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  meetingDate: string;
  meetingType: MeetingType;
  attendees: string[];
  ratingAvg: number;
  segueNotes: string | null;
  headlines: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScorecardMetric {
  id: string;
  name: string;
  owner: string;
  goalValue: number;
  goalType: GoalType;
  goalDirection: GoalDirection;
  category: MetricCategory;
  createdAt: string;
  updatedAt: string;
}

export interface ScorecardEntry {
  id: string;
  weekEndingDate: string;
  actualValue: number;
  onTrack: boolean;
  createdAt: string;
  metricId: string;
}

export interface PeopleAnalyzer {
  id: string;
  personName: string;
  personId: string;
  reviewDate: string;
  coreValueRatings: Record<string, number>;
  gwcGetsIt: boolean;
  gwcWantsIt: boolean;
  gwcCapacity: boolean;
  overallStatus: PersonStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyEstimateSettings {
  id: string;
  insuranceCertificateUrl: string | null;
  insuranceCompany: string | null;
  insurancePolicyNumber: string | null;
  insuranceCoverageAmount: number | null;
  insuranceExpirationDate: string | null;
  licenseImageUrl: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpirationDate: string | null;
  termsAndConditions: string;
  paymentTerms: string | null;
  warrantyTerms: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioImage {
  id: string;
  beforeUrl: string;
  afterUrl: string;
  projectType: ProjectType;
  description: string | null;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  sessionId: string;
  createdAt: string;
}

export interface AIMessage {
  id: string;
  role: AIRole;
  content: string;
  suggestedLineItems: unknown | null;
  suggestedRiskModifiers: string[];
  createdAt: string;
  conversationId: string;
}

// ============================================
// WITH RELATIONS (for joined queries)
// ============================================

export interface SessionWithUser extends Session {
  User: User;
}

export interface LeadWithAssignedTo extends Lead {
  TeamMember: TeamMember | null;
}

export interface EstimateWithRelations extends Estimate {
  Lead: Lead | null;
  EstimateLineItem: EstimateLineItem[];
  EstimateSignature: EstimateSignature | null;
}

export interface JobWithRelations extends Job {
  Lead: Lead | null;
  Estimate: Estimate | null;
  salesRep: TeamMember | null;
  projectManager: TeamMember | null;
  Subcontractor: Subcontractor | null;
}

export interface ScorecardMetricWithEntries extends ScorecardMetric {
  ScorecardEntry: ScorecardEntry[];
}

export interface AIConversationWithMessages extends AIConversation {
  AIMessage: AIMessage[];
}

// ============================================
// INSERT TYPES (for creating records - omit auto-generated fields)
// ============================================

export type UserInsert = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SessionInsert = Omit<Session, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: string;
};

export type LeadInsert = Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type EstimateInsert = Omit<Estimate, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type EstimateLineItemInsert = Omit<EstimateLineItem, 'id'> & {
  id?: string;
};

export type JobInsert = Omit<Job, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TeamMemberInsert = Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SubcontractorInsert = Omit<Subcontractor, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ============================================
// UPDATE TYPES (all fields optional)
// ============================================

export type UserUpdate = Partial<Omit<User, 'id' | 'createdAt'>>;
export type LeadUpdate = Partial<Omit<Lead, 'id' | 'createdAt'>>;
export type EstimateUpdate = Partial<Omit<Estimate, 'id' | 'createdAt'>>;
export type JobUpdate = Partial<Omit<Job, 'id' | 'createdAt'>>;
export type TeamMemberUpdate = Partial<Omit<TeamMember, 'id' | 'createdAt'>>;
export type SubcontractorUpdate = Partial<Omit<Subcontractor, 'id' | 'createdAt'>>;

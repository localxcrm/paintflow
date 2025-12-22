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
  suggestedLineItems: any | null;
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

// ============================================
// MULTI-TENANT & GHL ENUMS
// ============================================

export type TenantPlan = 'starter' | 'professional' | 'enterprise';
export type TenantUserRole = 'owner' | 'admin' | 'manager' | 'viewer';
export type GhlEventType =
  | 'contact_created'
  | 'contact_updated'
  | 'opportunity_created'
  | 'opportunity_updated'
  | 'opportunity_status_changed'
  | 'opportunity_stage_changed'
  | 'note_created'
  | 'task_created'
  | 'appointment_created'
  | 'appointment_updated';
export type GhlLeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'estimate_scheduled'
  | 'estimate_sent'
  | 'follow_up'
  | 'won'
  | 'lost';
export type CampaignPlatform = 'meta' | 'google' | 'tiktok' | 'bing' | 'other';
export type TargetPeriodType = 'annual' | 'quarterly' | 'monthly';

// ============================================
// MULTI-TENANT MODELS
// ============================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  plan: TenantPlan;
  isActive: boolean;
  timezone: string;
  currency: string;
  fiscalYearStart: number;
  maxUsers: number;
  maxWorkspaces: number;
  maxGhlLocations: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  billingEmail: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantUserRole;
  isActive: boolean;
  invitedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// GHL INTEGRATION MODELS
// ============================================

export interface GhlStageMapping {
  won_stage_id?: string;
  lost_stage_id?: string;
  estimate_stage_id?: string;
  [key: string]: string | undefined;
}

export interface GhlConnection {
  id: string;
  tenantId: string;
  workspaceId: string | null;
  locationId: string;
  locationName: string;
  apiKey: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  webhookSecret: string | null;
  webhookUrl: string | null;
  webhookEnabled: boolean;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  pipelineId: string | null;
  pipelineName: string | null;
  stageMapping: GhlStageMapping;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GhlEventRaw {
  id: string;
  tenantId: string;
  connectionId: string;
  locationId: string;
  eventType: string;
  eventId: string | null;
  payload: Record<string, unknown>;
  processedAt: string | null;
  processingError: string | null;
  retryCount: number;
  receivedAt: string;
}

export interface GhlLead {
  id: string;
  tenantId: string;
  connectionId: string;
  workspaceId: string | null;
  ghlContactId: string;
  ghlOpportunityId: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  source: string | null;
  tags: string[];
  customFields: Record<string, unknown>;
  pipelineId: string | null;
  pipelineName: string | null;
  stageId: string | null;
  stageName: string | null;
  status: GhlLeadStatus;
  monetaryValue: number;
  estimatedValue: number;
  actualValue: number;
  wonAt: string | null;
  lostAt: string | null;
  lostReason: string | null;
  estimateSentAt: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  ghlCreatedAt: string | null;
  ghlUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TARGETS & SEASONALITY MODELS
// ============================================

export interface Target {
  id: string;
  tenantId: string;
  workspaceId: string | null;
  year: number;
  periodType: TargetPeriodType;
  period: number | null;
  revenueTarget: number;
  jobsTarget: number;
  leadsTarget: number;
  estimatesTarget: number;
  closeRateTarget: number;
  averageTicketTarget: number;
  marketingBudget: number;
  cplTarget: number;
  cacTarget: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Seasonality {
  id: string;
  tenantId: string;
  year: number;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// MARKETING & KPI MODELS
// ============================================

export interface CampaignSpend {
  id: string;
  tenantId: string;
  workspaceId: string | null;
  platform: CampaignPlatform;
  campaignName: string;
  campaignId: string | null;
  date: string;
  spend: number;
  impressions: number | null;
  clicks: number | null;
  leads: number | null;
  cpc: number | null;
  cpl: number | null;
  ctr: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyKpi {
  id: string;
  tenantId: string;
  workspaceId: string | null;
  date: string;
  leadsNew: number;
  leadsContacted: number;
  leadsQualified: number;
  estimatesScheduled: number;
  estimatesSent: number;
  estimatesAccepted: number;
  estimatesDeclined: number;
  jobsWon: number;
  jobsLost: number;
  revenueWon: number;
  revenueLost: number;
  marketingSpend: number;
  cpl: number | null;
  cac: number | null;
  closeRate: number | null;
  conversionRate: number | null;
  averageTicket: number | null;
  leadsBySource: Record<string, number>;
  revenueBySource: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// MULTI-TENANT RELATIONS
// ============================================

export interface TenantWithUsers extends Tenant {
  TenantUser: TenantUserWithUser[];
}

export interface TenantUserWithUser extends TenantUser {
  User: User;
}

export interface TenantUserWithTenant extends TenantUser {
  Tenant: Tenant;
}

export interface GhlConnectionWithLeads extends GhlConnection {
  GhlLead: GhlLead[];
}

export interface GhlLeadWithConnection extends GhlLead {
  GhlConnection: GhlConnection;
}

// ============================================
// MULTI-TENANT INSERT TYPES
// ============================================

export type TenantInsert = Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TenantUserInsert = Omit<TenantUser, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkspaceInsert = Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GhlConnectionInsert = Omit<GhlConnection, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GhlEventRawInsert = Omit<GhlEventRaw, 'id' | 'receivedAt'> & {
  id?: string;
  receivedAt?: string;
};

export type GhlLeadInsert = Omit<GhlLead, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TargetInsert = Omit<Target, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SeasonalityInsert = Omit<Seasonality, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CampaignSpendInsert = Omit<CampaignSpend, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DailyKpiInsert = Omit<DailyKpi, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ============================================
// MULTI-TENANT UPDATE TYPES
// ============================================

export type TenantUpdate = Partial<Omit<Tenant, 'id' | 'createdAt'>>;
export type TenantUserUpdate = Partial<Omit<TenantUser, 'id' | 'createdAt'>>;
export type WorkspaceUpdate = Partial<Omit<Workspace, 'id' | 'createdAt'>>;
export type GhlConnectionUpdate = Partial<Omit<GhlConnection, 'id' | 'createdAt'>>;
export type GhlLeadUpdate = Partial<Omit<GhlLead, 'id' | 'createdAt'>>;
export type TargetUpdate = Partial<Omit<Target, 'id' | 'createdAt'>>;
export type SeasonalityUpdate = Partial<Omit<Seasonality, 'id' | 'createdAt'>>;
export type CampaignSpendUpdate = Partial<Omit<CampaignSpend, 'id' | 'createdAt'>>;
export type DailyKpiUpdate = Partial<Omit<DailyKpi, 'id' | 'createdAt'>>;

// ============================================
// KPI CALCULATION TYPES
// ============================================

export interface KpiSummary {
  // Lead metrics
  leadsTotal: number;
  leadsNew: number;
  leadsContacted: number;
  leadsQualified: number;

  // Estimate metrics
  estimatesScheduled: number;
  estimatesSent: number;
  estimatesAccepted: number;
  estimatesDeclined: number;

  // Sales metrics
  jobsWon: number;
  jobsLost: number;
  revenueWon: number;
  revenueLost: number;

  // Marketing metrics
  marketingSpend: number;
  cpl: number | null;
  cac: number | null;

  // Calculated rates
  closeRate: number | null;
  conversionRate: number | null;
  averageTicket: number | null;
}

export interface KpiWithTarget extends KpiSummary {
  // Targets
  revenueTarget: number;
  leadsTarget: number;
  jobsTarget: number;

  // Achievement percentages
  revenueAchievement: number;
  leadsAchievement: number;
  jobsAchievement: number;

  // Status indicators
  revenueStatus: 'on_track' | 'at_risk' | 'behind';
  leadsStatus: 'on_track' | 'at_risk' | 'behind';
  jobsStatus: 'on_track' | 'at_risk' | 'behind';
}

export interface MonthlyTarget {
  revenueTarget: number;
  leadsTarget: number;
  jobsTarget: number;
}

export interface DailyTarget {
  revenueTarget: number;
  leadsTarget: number;
  jobsTarget: number;
}

// ============================================
// GHL WEBHOOK PAYLOAD TYPES
// ============================================

export interface GhlWebhookPayload {
  type: string;
  locationId: string;
  id?: string;
  contact?: GhlContactPayload;
  opportunity?: GhlOpportunityPayload;
  [key: string]: unknown;
}

export interface GhlContactPayload {
  id: string;
  locationId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, unknown>[];
  dateAdded?: string;
  dateUpdated?: string;
  [key: string]: unknown;
}

export interface GhlOpportunityPayload {
  id: string;
  locationId: string;
  contactId: string;
  name?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  status?: string;
  monetaryValue?: number;
  assignedTo?: string;
  source?: string;
  dateAdded?: string;
  dateUpdated?: string;
  [key: string]: unknown;
}

export interface GhlPipeline {
  id: string;
  name: string;
  stages: GhlPipelineStage[];
}

export interface GhlPipelineStage {
  id: string;
  name: string;
  position: number;
}

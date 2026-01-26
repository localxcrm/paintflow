// Client Portal Types
// Types for public client access without login

// ============================================
// DATABASE MODELS
// ============================================

/** Client access token for magic link */
export interface ClientAccessToken {
  id: string;
  jobId: string;
  organizationId: string;
  token: string;
  clientEmail: string;
  clientName: string | null;
  expiresAt: string;
  isActive: boolean;
  lastAccessedAt: string | null;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Client message in portal */
export interface ClientMessage {
  id: string;
  accessTokenId: string;
  jobId: string;
  organizationId: string;
  authorType: 'client' | 'admin';
  authorName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ============================================
// PORTAL DATA TYPES
// ============================================

/** Job status for client view */
export interface ClientJobStatus {
  jobId: string;
  jobNumber: string;
  clientName: string;
  address: string;
  projectType: 'interior' | 'exterior' | 'both';
  status: 'lead' | 'got_the_job' | 'scheduled' | 'completed';
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  completionPercentage: number;
  lastUpdated: string;
}

/** Photo for client gallery */
export interface ClientPhoto {
  id: string;
  url: string;
  caption: string | null;
  type: 'before' | 'progress' | 'after';
  takenAt: string;
}

/** Estimate/invoice for client view */
export interface ClientInvoice {
  id: string;
  estimateNumber: string;
  totalPrice: number;
  depositAmount: number;
  depositPaid: boolean;
  balanceDue: number;
  balancePaid: boolean;
  pdfUrl: string | null;
  createdAt: string;
}

/** Complete portal data for a job */
export interface ClientPortalData {
  token: string;
  expiresAt: string;
  job: ClientJobStatus;
  photos: ClientPhoto[];
  messages: ClientMessage[];
  invoice: ClientInvoice | null;
  organization: {
    name: string;
    phone: string | null;
    email: string | null;
  };
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/** Create token request */
export interface CreateTokenRequest {
  jobId: string;
  clientEmail: string;
  clientName?: string;
  expiresInDays?: number;
  sendEmail?: boolean;
}

/** Create token response */
export interface CreateTokenResponse {
  token: ClientAccessToken;
  magicLink: string;
}

/** Send message request */
export interface SendMessageRequest {
  token: string;
  message: string;
}

// ============================================
// STATUS MAPPING
// ============================================

export const JOB_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  lead: { label: 'Orçamento', color: '#6b7280' },
  got_the_job: { label: 'Aprovado', color: '#3b82f6' },
  scheduled: { label: 'Agendado', color: '#f59e0b' },
  completed: { label: 'Concluído', color: '#22c55e' },
};

export const PHOTO_TYPE_LABELS: Record<string, string> = {
  before: 'Antes',
  progress: 'Em Andamento',
  after: 'Depois',
};

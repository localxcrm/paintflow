-- PaintFlow Database Schema
-- PostgreSQL 17

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');
CREATE TYPE team_role AS ENUM ('sales', 'pm', 'both');
CREATE TYPE subcontractor_type AS ENUM ('interior', 'exterior', 'both');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'estimate_scheduled', 'estimated', 'proposal_sent', 'follow_up', 'won', 'lost');
CREATE TYPE project_type AS ENUM ('interior', 'exterior', 'both');
CREATE TYPE estimate_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired');
CREATE TYPE scope_type AS ENUM ('walls_only', 'walls_trim', 'walls_trim_ceiling', 'full_refresh');
CREATE TYPE job_status AS ENUM ('lead', 'got_the_job', 'scheduled', 'completed');
CREATE TYPE profit_flag AS ENUM ('OK', 'RAISE_PRICE', 'FIX_SCOPE');
CREATE TYPE addon_category AS ENUM ('interior', 'exterior', 'both');
CREATE TYPE rock_type AS ENUM ('company', 'individual');
CREATE TYPE rock_status AS ENUM ('on_track', 'off_track', 'complete', 'dropped');
CREATE TYPE todo_status AS ENUM ('pending', 'done');
CREATE TYPE issue_type AS ENUM ('short_term', 'long_term');
CREATE TYPE issue_status AS ENUM ('open', 'in_discussion', 'solved');
CREATE TYPE meeting_type AS ENUM ('l10', 'quarterly', 'annual');
CREATE TYPE goal_type AS ENUM ('number', 'currency', 'percent');
CREATE TYPE goal_direction AS ENUM ('above', 'below');
CREATE TYPE metric_category AS ENUM ('leading', 'lagging');
CREATE TYPE person_status AS ENUM ('right_person_right_seat', 'needs_work', 'wrong_fit');
CREATE TYPE ai_role AS ENUM ('user', 'assistant');
CREATE TYPE lead_event_type AS ENUM ('lead_created', 'appointment_booked', 'estimate_sent', 'contract_sent', 'job_won', 'job_lost');
CREATE TYPE marketing_channel AS ENUM ('google', 'facebook', 'referral', 'yard_sign', 'door_knock', 'repeat', 'site', 'other');
CREATE TYPE plan_type AS ENUM ('free', 'starter', 'pro', 'enterprise');

-- ============================================
-- CORE TABLES (Multi-tenant)
-- ============================================

CREATE TABLE "Organization" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan plan_type NOT NULL DEFAULT 'free',
  "stripeCustomerId" VARCHAR(255),
  "stripeSubscriptionId" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMP WITH TIME ZONE,
  "ghlUserId" VARCHAR(255),
  "ghlLocationId" VARCHAR(255),
  "ghlLinkedAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "UserOrganization" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", "organizationId")
);

CREATE TABLE "Session" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(255) UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "organizationId" UUID REFERENCES "Organization"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BUSINESS SETTINGS
-- ============================================

CREATE TABLE "BusinessSettings" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "subPayoutPct" DECIMAL(5,2) NOT NULL DEFAULT 50.0,
  "subMaterialsPct" DECIMAL(5,2) NOT NULL DEFAULT 20.0,
  "subLaborPct" DECIMAL(5,2) NOT NULL DEFAULT 80.0,
  "minGrossProfitPerJob" DECIMAL(10,2) NOT NULL DEFAULT 500.0,
  "targetGrossMarginPct" DECIMAL(5,2) NOT NULL DEFAULT 50.0,
  "defaultDepositPct" DECIMAL(5,2) NOT NULL DEFAULT 50.0,
  "arTargetDays" INTEGER NOT NULL DEFAULT 30,
  "priceRoundingIncrement" DECIMAL(10,2) NOT NULL DEFAULT 25.0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("organizationId")
);

-- ============================================
-- TEAM & SUBCONTRACTORS
-- ============================================

CREATE TABLE "TeamMember" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role team_role NOT NULL DEFAULT 'sales',
  "defaultCommissionPct" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "Subcontractor" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  "companyName" VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  specialty subcontractor_type NOT NULL DEFAULT 'both',
  "defaultPayoutPct" DECIMAL(5,2) NOT NULL DEFAULT 50.0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  "passwordHash" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "SubcontractorSession" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(255) UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "subcontractorId" UUID NOT NULL REFERENCES "Subcontractor"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- LEADS & ESTIMATES
-- ============================================

CREATE TABLE "Lead" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  "zipCode" VARCHAR(20) NOT NULL,
  source VARCHAR(100) NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',
  "projectType" project_type NOT NULL DEFAULT 'interior',
  "leadDate" DATE NOT NULL,
  "nextFollowupDate" DATE,
  "estimatedJobValue" DECIMAL(10,2),
  "wonLostReason" TEXT,
  notes TEXT,
  "assignedToId" UUID REFERENCES "TeamMember"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "Estimate" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "estimateNumber" VARCHAR(50) NOT NULL,
  "clientName" VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  status estimate_status NOT NULL DEFAULT 'draft',
  "estimateDate" DATE NOT NULL,
  "validUntil" DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "subMaterialsCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "subLaborCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "subTotalCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "grossProfit" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "grossMarginPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "meetsMinGp" BOOLEAN NOT NULL DEFAULT false,
  "meetsTargetGm" BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  "leadId" UUID REFERENCES "Lead"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("organizationId", "estimateNumber")
);

CREATE TABLE "EstimateLineItem" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "estimateId" UUID NOT NULL REFERENCES "Estimate"(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  scope scope_type,
  quantity INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "lineTotal" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "EstimateSignature" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "estimateId" UUID NOT NULL REFERENCES "Estimate"(id) ON DELETE CASCADE,
  "clientName" VARCHAR(255) NOT NULL,
  "signatureDataUrl" TEXT NOT NULL,
  "signedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "ipAddress" VARCHAR(50),
  UNIQUE("estimateId")
);

-- ============================================
-- JOBS
-- ============================================

CREATE TABLE "Job" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "jobNumber" VARCHAR(50) NOT NULL,
  "clientName" VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50),
  "zipCode" VARCHAR(20),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  "projectType" project_type NOT NULL DEFAULT 'interior',
  status job_status NOT NULL DEFAULT 'lead',
  "jobDate" DATE NOT NULL,
  "scheduledStartDate" DATE,
  "scheduledEndDate" DATE,
  "actualStartDate" DATE,
  "actualEndDate" DATE,
  "jobValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "subMaterials" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "subLabor" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "subTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "grossProfit" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "grossMarginPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "depositRequired" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "depositPaid" BOOLEAN NOT NULL DEFAULT false,
  "jobPaid" BOOLEAN NOT NULL DEFAULT false,
  "balanceDue" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "invoiceDate" DATE,
  "paymentReceivedDate" DATE,
  "daysToCollect" INTEGER,
  "salesCommissionPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "salesCommissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "salesCommissionPaid" BOOLEAN NOT NULL DEFAULT false,
  "pmCommissionPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "pmCommissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "pmCommissionPaid" BOOLEAN NOT NULL DEFAULT false,
  "subcontractorPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "subcontractorPaid" BOOLEAN NOT NULL DEFAULT false,
  "meetsMinGp" BOOLEAN NOT NULL DEFAULT false,
  "meetsTargetGm" BOOLEAN NOT NULL DEFAULT false,
  "profitFlag" profit_flag NOT NULL DEFAULT 'OK',
  notes TEXT,
  "leadId" UUID REFERENCES "Lead"(id) ON DELETE SET NULL,
  "estimateId" UUID REFERENCES "Estimate"(id) ON DELETE SET NULL,
  "salesRepId" UUID REFERENCES "TeamMember"(id) ON DELETE SET NULL,
  "projectManagerId" UUID REFERENCES "TeamMember"(id) ON DELETE SET NULL,
  "subcontractorId" UUID REFERENCES "Subcontractor"(id) ON DELETE SET NULL,
  "ghlContactId" VARCHAR(255),
  "ghlOpportunityId" VARCHAR(255),
  "leadSource" VARCHAR(100),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("organizationId", "jobNumber")
);

-- ============================================
-- WORK ORDERS
-- ============================================

CREATE TABLE "WorkOrder" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(100) UNIQUE NOT NULL,
  "jobId" UUID NOT NULL REFERENCES "Job"(id) ON DELETE CASCADE,
  "subcontractorId" UUID NOT NULL REFERENCES "Subcontractor"(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  "payoutAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "paidAt" TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "WorkOrderPhoto" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workOrderId" UUID NOT NULL REFERENCES "WorkOrder"(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  "photoType" VARCHAR(50) NOT NULL DEFAULT 'progress',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "WorkOrderNote" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workOrderId" UUID NOT NULL REFERENCES "WorkOrder"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "audioUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRICING
-- ============================================

CREATE TABLE "RoomPrice" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "roomType" VARCHAR(100) NOT NULL,
  size VARCHAR(50) NOT NULL,
  "typicalSqft" INTEGER NOT NULL,
  "wallsOnly" DECIMAL(10,2) NOT NULL,
  "wallsTrim" DECIMAL(10,2) NOT NULL,
  "wallsTrimCeiling" DECIMAL(10,2) NOT NULL,
  "fullRefresh" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "ExteriorPrice" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "surfaceType" VARCHAR(100) NOT NULL,
  "pricePerSqft" DECIMAL(10,4) NOT NULL,
  "prepMultiplier" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "Addon" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category addon_category NOT NULL DEFAULT 'both',
  unit VARCHAR(50) NOT NULL,
  "basePrice" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EOS/TRACTION
-- ============================================

CREATE TABLE "VTO" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "coreValues" TEXT[] NOT NULL DEFAULT '{}',
  "coreFocusPurpose" TEXT NOT NULL DEFAULT '',
  "coreFocusNiche" TEXT NOT NULL DEFAULT '',
  "tenYearTarget" TEXT NOT NULL DEFAULT '',
  "threeYearRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "threeYearProfit" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "threeYearPicture" TEXT NOT NULL DEFAULT '',
  "oneYearRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "oneYearProfit" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "oneYearGoals" TEXT[] NOT NULL DEFAULT '{}',
  "targetMarket" TEXT NOT NULL DEFAULT '',
  "threeUniques" TEXT[] NOT NULL DEFAULT '{}',
  "provenProcess" TEXT NOT NULL DEFAULT '',
  guarantee TEXT NOT NULL DEFAULT '',
  "longTermIssues" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("organizationId")
);

CREATE TABLE "Rock" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  owner VARCHAR(255) NOT NULL,
  "rockType" rock_type NOT NULL DEFAULT 'individual',
  quarter INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status rock_status NOT NULL DEFAULT 'on_track',
  "dueDate" DATE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "Todo" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  "dueDate" DATE NOT NULL,
  status todo_status NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "Issue" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "issueType" issue_type NOT NULL DEFAULT 'short_term',
  priority INTEGER NOT NULL DEFAULT 1,
  status issue_status NOT NULL DEFAULT 'open',
  "createdBy" VARCHAR(255) NOT NULL,
  resolution TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "Seat" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "seatName" VARCHAR(255) NOT NULL,
  "roleDescription" TEXT NOT NULL,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  "personName" VARCHAR(255),
  "personId" UUID,
  "reportsToId" UUID REFERENCES "Seat"(id) ON DELETE SET NULL,
  "gwcGetsIt" BOOLEAN NOT NULL DEFAULT false,
  "gwcWantsIt" BOOLEAN NOT NULL DEFAULT false,
  "gwcCapacity" BOOLEAN NOT NULL DEFAULT false,
  "isRightPersonRightSeat" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "Meeting" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "meetingDate" DATE NOT NULL,
  "meetingType" meeting_type NOT NULL DEFAULT 'l10',
  attendees TEXT[] NOT NULL DEFAULT '{}',
  "ratingAvg" DECIMAL(3,2) NOT NULL DEFAULT 0,
  "segueNotes" TEXT,
  headlines TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "ScorecardMetric" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  "goalValue" DECIMAL(12,2) NOT NULL,
  "goalType" goal_type NOT NULL DEFAULT 'number',
  "goalDirection" goal_direction NOT NULL DEFAULT 'above',
  category metric_category NOT NULL DEFAULT 'leading',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "ScorecardEntry" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "metricId" UUID NOT NULL REFERENCES "ScorecardMetric"(id) ON DELETE CASCADE,
  "weekEndingDate" DATE NOT NULL,
  "actualValue" DECIMAL(12,2) NOT NULL,
  "onTrack" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("metricId", "weekEndingDate")
);

CREATE TABLE "PeopleAnalyzer" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "personName" VARCHAR(255) NOT NULL,
  "personId" UUID NOT NULL,
  "reviewDate" DATE NOT NULL,
  "coreValueRatings" JSONB NOT NULL DEFAULT '{}',
  "gwcGetsIt" BOOLEAN NOT NULL DEFAULT false,
  "gwcWantsIt" BOOLEAN NOT NULL DEFAULT false,
  "gwcCapacity" BOOLEAN NOT NULL DEFAULT false,
  "overallStatus" person_status NOT NULL DEFAULT 'needs_work',
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ESTIMATE SETTINGS & PORTFOLIO
-- ============================================

CREATE TABLE "CompanyEstimateSettings" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "insuranceCertificateUrl" TEXT,
  "insuranceCompany" VARCHAR(255),
  "insurancePolicyNumber" VARCHAR(100),
  "insuranceCoverageAmount" DECIMAL(12,2),
  "insuranceExpirationDate" DATE,
  "licenseImageUrl" TEXT,
  "licenseNumber" VARCHAR(100),
  "licenseState" VARCHAR(50),
  "licenseExpirationDate" DATE,
  "termsAndConditions" TEXT NOT NULL DEFAULT '',
  "paymentTerms" TEXT,
  "warrantyTerms" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("organizationId")
);

CREATE TABLE "PortfolioImage" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "beforeUrl" TEXT NOT NULL,
  "afterUrl" TEXT NOT NULL,
  "projectType" project_type NOT NULL DEFAULT 'interior',
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AI CONVERSATIONS
-- ============================================

CREATE TABLE "AIConversation" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "sessionId" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "AIMessage" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "conversationId" UUID NOT NULL REFERENCES "AIConversation"(id) ON DELETE CASCADE,
  role ai_role NOT NULL,
  content TEXT NOT NULL,
  "suggestedLineItems" JSONB,
  "suggestedRiskModifiers" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- GHL INTEGRATION
-- ============================================

CREATE TABLE "GhlLocation" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "ghlLocationId" VARCHAR(255) UNIQUE NOT NULL,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "locationName" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE "LeadEvent" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "ghlContactId" VARCHAR(255) NOT NULL,
  "eventType" lead_event_type NOT NULL,
  channel VARCHAR(100),
  "eventData" JSONB,
  "utmSource" VARCHAR(255),
  "utmMedium" VARCHAR(255),
  "utmCampaign" VARCHAR(255),
  "utmContent" VARCHAR(255),
  "utmTerm" VARCHAR(255),
  referrer TEXT,
  "landingPage" TEXT,
  "sessionSource" VARCHAR(255),
  gclid VARCHAR(255),
  fbclid VARCHAR(255),
  "gaClientId" VARCHAR(255),
  "clientName" VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(50),
  "jobValue" DECIMAL(10,2),
  "projectType" project_type,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PUSH NOTIFICATIONS
-- ============================================

CREATE TABLE "PushSubscription" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("userId", endpoint)
);

-- ============================================
-- INDEXES
-- ============================================

-- User & Session
CREATE INDEX idx_session_token ON "Session"(token);
CREATE INDEX idx_session_userId ON "Session"("userId");
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_userorg_userId ON "UserOrganization"("userId");
CREATE INDEX idx_userorg_orgId ON "UserOrganization"("organizationId");

-- Leads
CREATE INDEX idx_lead_org ON "Lead"("organizationId");
CREATE INDEX idx_lead_status ON "Lead"(status);
CREATE INDEX idx_lead_date ON "Lead"("leadDate");

-- Estimates
CREATE INDEX idx_estimate_org ON "Estimate"("organizationId");
CREATE INDEX idx_estimate_status ON "Estimate"(status);
CREATE INDEX idx_estimate_leadId ON "Estimate"("leadId");

-- Jobs
CREATE INDEX idx_job_org ON "Job"("organizationId");
CREATE INDEX idx_job_status ON "Job"(status);
CREATE INDEX idx_job_date ON "Job"("jobDate");
CREATE INDEX idx_job_subcontractor ON "Job"("subcontractorId");
CREATE INDEX idx_job_ghl ON "Job"("ghlContactId");

-- Work Orders
CREATE INDEX idx_workorder_job ON "WorkOrder"("jobId");
CREATE INDEX idx_workorder_sub ON "WorkOrder"("subcontractorId");
CREATE INDEX idx_workorder_token ON "WorkOrder"(token);

-- EOS
CREATE INDEX idx_rock_org ON "Rock"("organizationId");
CREATE INDEX idx_todo_org ON "Todo"("organizationId");
CREATE INDEX idx_issue_org ON "Issue"("organizationId");
CREATE INDEX idx_meeting_org ON "Meeting"("organizationId");

-- Subcontractor sessions
CREATE INDEX idx_subsession_token ON "SubcontractorSession"(token);
CREATE INDEX idx_subsession_sub ON "SubcontractorSession"("subcontractorId");

-- GHL
CREATE INDEX idx_ghllocation_org ON "GhlLocation"("organizationId");
CREATE INDEX idx_leadevent_org ON "LeadEvent"("organizationId");
CREATE INDEX idx_leadevent_contact ON "LeadEvent"("ghlContactId");

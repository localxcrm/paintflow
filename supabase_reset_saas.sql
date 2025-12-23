-- ============================================
-- PaintPro SaaS - Complete Database Reset
-- Multi-Tenancy Schema with RLS
-- Version: 4.0
-- ============================================

-- ============================================
-- PART 1: DROP ALL EXISTING TABLES
-- ============================================

-- Drop in reverse dependency order
DROP TABLE IF EXISTS "AIMessage" CASCADE;
DROP TABLE IF EXISTS "AIConversation" CASCADE;
DROP TABLE IF EXISTS "PortfolioImage" CASCADE;
DROP TABLE IF EXISTS "PeopleAnalyzer" CASCADE;
DROP TABLE IF EXISTS "ScorecardEntry" CASCADE;
DROP TABLE IF EXISTS "ScorecardMetric" CASCADE;
DROP TABLE IF EXISTS "Meeting" CASCADE;
DROP TABLE IF EXISTS "Seat" CASCADE;
DROP TABLE IF EXISTS "Issue" CASCADE;
DROP TABLE IF EXISTS "Todo" CASCADE;
DROP TABLE IF EXISTS "Rock" CASCADE;
DROP TABLE IF EXISTS "KnowledgeArticle" CASCADE;
DROP TABLE IF EXISTS "MarketingSpend" CASCADE;
DROP TABLE IF EXISTS "WeeklySales" CASCADE;
DROP TABLE IF EXISTS "EstimateSignature" CASCADE;
DROP TABLE IF EXISTS "EstimateLineItem" CASCADE;
DROP TABLE IF EXISTS "Estimate" CASCADE;
DROP TABLE IF EXISTS "Job" CASCADE;
DROP TABLE IF EXISTS "Lead" CASCADE;
DROP TABLE IF EXISTS "Subcontractor" CASCADE;
DROP TABLE IF EXISTS "TeamMember" CASCADE;
DROP TABLE IF EXISTS "Addon" CASCADE;
DROP TABLE IF EXISTS "ExteriorPrice" CASCADE;
DROP TABLE IF EXISTS "RoomPrice" CASCADE;
DROP TABLE IF EXISTS "CompanyEstimateSettings" CASCADE;
DROP TABLE IF EXISTS "BusinessSettings" CASCADE;
DROP TABLE IF EXISTS "VTO" CASCADE;
DROP TABLE IF EXISTS "Invitation" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "UserOrganization" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Organization" CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS get_current_org_id() CASCADE;

-- ============================================
-- PART 2: CREATE NEW TABLES WITH MULTI-TENANCY
-- ============================================

-- -----------------------------
-- Organization (NEW - Core SaaS)
-- -----------------------------
CREATE TABLE "Organization" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "logo" TEXT,
  "website" TEXT,
  "timezone" TEXT DEFAULT 'America/Sao_Paulo',
  "currency" TEXT DEFAULT 'BRL',
  "plan" TEXT DEFAULT 'free' CHECK ("plan" IN ('free', 'starter', 'pro', 'enterprise')),
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "planExpiresAt" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- User (Base - No organizationId)
-- -----------------------------
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "avatar" TEXT,
  "phone" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "emailVerified" BOOLEAN DEFAULT false,
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- UserOrganization (NEW - Junction Table)
-- -----------------------------
CREATE TABLE "UserOrganization" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "role" TEXT DEFAULT 'member' CHECK ("role" IN ('owner', 'admin', 'member', 'viewer')),
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", "organizationId")
);

-- -----------------------------
-- Session (Updated - with organizationId)
-- -----------------------------
CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "organizationId" TEXT REFERENCES "Organization"("id") ON DELETE SET NULL,
  "token" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Invitation (NEW)
-- -----------------------------
CREATE TABLE "Invitation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "role" TEXT DEFAULT 'member' CHECK ("role" IN ('admin', 'member', 'viewer')),
  "token" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "invitedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "acceptedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- VTO (Vision/Traction Organizer)
-- -----------------------------
CREATE TABLE "VTO" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "coreValues" JSONB DEFAULT '[]',
  "coreFocus" JSONB DEFAULT '{"purpose": "", "niche": ""}',
  "tenYearTarget" TEXT,
  "threeYearPicture" JSONB DEFAULT '{"revenue": "", "profit": "", "measurables": []}',
  "oneYearPlan" JSONB DEFAULT '{"revenue": "", "profit": "", "goals": []}',
  "quarterlyRocks" JSONB DEFAULT '[]',
  "issuesList" JSONB DEFAULT '[]',
  "annualTarget" NUMERIC DEFAULT 1000000,
  "formulaParams" JSONB DEFAULT '{"avgTicket": 3500, "closeRate": 0.35, "showRate": 0.70, "leadToEstimate": 0.85}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId")
);

-- -----------------------------
-- BusinessSettings
-- -----------------------------
CREATE TABLE "BusinessSettings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "companyName" TEXT,
  "logo" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "website" TEXT,
  "taxId" TEXT,
  "marketingChannels" JSONB DEFAULT '[{"id": "meta", "label": "Meta Ads", "color": "#1877F2"}, {"id": "google", "label": "Google Ads", "color": "#EA4335"}, {"id": "indicacao", "label": "Indicação", "color": "#10B981"}, {"id": "organico", "label": "Orgânico", "color": "#8B5CF6"}]',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId")
);

-- -----------------------------
-- CompanyEstimateSettings
-- -----------------------------
CREATE TABLE "CompanyEstimateSettings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "companyName" TEXT,
  "logo" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "estimatePrefix" TEXT DEFAULT 'EST',
  "nextEstimateNumber" INTEGER DEFAULT 1001,
  "taxRate" NUMERIC DEFAULT 0,
  "defaultNotes" TEXT,
  "defaultTerms" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId")
);

-- -----------------------------
-- TeamMember
-- -----------------------------
CREATE TABLE "TeamMember" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "role" TEXT,
  "color" TEXT DEFAULT '#3B82F6',
  "avatar" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "hourlyRate" NUMERIC,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Subcontractor
-- -----------------------------
CREATE TABLE "Subcontractor" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "specialty" TEXT,
  "color" TEXT DEFAULT '#10B981',
  "notes" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "rating" INTEGER DEFAULT 5,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Lead
-- -----------------------------
CREATE TABLE "Lead" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "source" TEXT,
  "status" TEXT DEFAULT 'new' CHECK ("status" IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  "notes" TEXT,
  "estimatedValue" NUMERIC,
  "assignedTo" TEXT REFERENCES "TeamMember"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Estimate
-- -----------------------------
CREATE TABLE "Estimate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "estimateNumber" TEXT NOT NULL,
  "leadId" TEXT REFERENCES "Lead"("id") ON DELETE SET NULL,
  "clientName" TEXT NOT NULL,
  "clientEmail" TEXT,
  "clientPhone" TEXT,
  "clientAddress" TEXT,
  "status" TEXT DEFAULT 'draft' CHECK ("status" IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  "subtotal" NUMERIC DEFAULT 0,
  "taxAmount" NUMERIC DEFAULT 0,
  "discount" NUMERIC DEFAULT 0,
  "total" NUMERIC DEFAULT 0,
  "notes" TEXT,
  "terms" TEXT,
  "validUntil" DATE,
  "sentAt" TIMESTAMP,
  "viewedAt" TIMESTAMP,
  "acceptedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- EstimateLineItem
-- -----------------------------
CREATE TABLE "EstimateLineItem" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "quantity" NUMERIC DEFAULT 1,
  "unit" TEXT DEFAULT 'un',
  "unitPrice" NUMERIC NOT NULL,
  "total" NUMERIC NOT NULL,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- EstimateSignature
-- -----------------------------
CREATE TABLE "EstimateSignature" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "signatureData" TEXT NOT NULL,
  "signerName" TEXT,
  "signerEmail" TEXT,
  "ipAddress" TEXT,
  "signedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Job
-- -----------------------------
CREATE TABLE "Job" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "clientName" TEXT NOT NULL,
  "clientEmail" TEXT,
  "clientPhone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "latitude" NUMERIC,
  "longitude" NUMERIC,
  "status" TEXT DEFAULT 'scheduled' CHECK ("status" IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  "priority" TEXT DEFAULT 'medium' CHECK ("priority" IN ('low', 'medium', 'high', 'urgent')),
  "startDate" DATE,
  "endDate" DATE,
  "estimatedHours" NUMERIC,
  "actualHours" NUMERIC,
  "revenue" NUMERIC DEFAULT 0,
  "cost" NUMERIC DEFAULT 0,
  "assignedTo" TEXT REFERENCES "TeamMember"("id") ON DELETE SET NULL,
  "subcontractorId" TEXT REFERENCES "Subcontractor"("id") ON DELETE SET NULL,
  "notes" TEXT,
  "photos" JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- WeeklySales
-- -----------------------------
CREATE TABLE "WeeklySales" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "weekStart" DATE NOT NULL,
  "leads" INTEGER DEFAULT 0,
  "estimates" INTEGER DEFAULT 0,
  "sales" INTEGER DEFAULT 0,
  "revenue" NUMERIC DEFAULT 0,
  "channels" JSONB DEFAULT '{}',
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", "weekStart")
);

-- -----------------------------
-- MarketingSpend
-- -----------------------------
CREATE TABLE "MarketingSpend" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "source" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "leads" INTEGER DEFAULT 0,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", "source", "month", "year")
);

-- -----------------------------
-- KnowledgeArticle
-- -----------------------------
CREATE TABLE "KnowledgeArticle" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "content" TEXT,
  "checklist" JSONB DEFAULT '[]',
  "images" JSONB DEFAULT '[]',
  "videoUrl" TEXT,
  "isPublished" BOOLEAN DEFAULT true,
  "createdBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Rock (Quarterly Goals)
-- -----------------------------
CREATE TABLE "Rock" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "owner" TEXT NOT NULL,
  "rockType" TEXT DEFAULT 'company' CHECK ("rockType" IN ('company', 'departmental', 'individual')),
  "quarter" INTEGER NOT NULL CHECK ("quarter" BETWEEN 1 AND 4),
  "year" INTEGER NOT NULL,
  "status" TEXT DEFAULT 'on_track' CHECK ("status" IN ('on_track', 'off_track', 'complete', 'dropped')),
  "dueDate" DATE,
  "milestones" JSONB DEFAULT '[]',
  "statusHistory" JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Todo (EOS To-Do List)
-- -----------------------------
CREATE TABLE "Todo" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "dueDate" DATE,
  "isCompleted" BOOLEAN DEFAULT false,
  "completedAt" TIMESTAMP,
  "rockId" TEXT REFERENCES "Rock"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Issue (EOS Issues List)
-- -----------------------------
CREATE TABLE "Issue" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "owner" TEXT,
  "priority" TEXT DEFAULT 'medium' CHECK ("priority" IN ('low', 'medium', 'high')),
  "status" TEXT DEFAULT 'open' CHECK ("status" IN ('open', 'in_progress', 'resolved', 'dropped')),
  "resolvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Seat (Accountability Chart)
-- -----------------------------
CREATE TABLE "Seat" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "responsibilities" JSONB DEFAULT '[]',
  "parentId" TEXT REFERENCES "Seat"("id") ON DELETE SET NULL,
  "teamMemberId" TEXT REFERENCES "TeamMember"("id") ON DELETE SET NULL,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Meeting (L10 Meetings)
-- -----------------------------
CREATE TABLE "Meeting" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "meetingType" TEXT DEFAULT 'l10' CHECK ("meetingType" IN ('l10', 'quarterly', 'annual', 'other')),
  "scheduledAt" TIMESTAMP NOT NULL,
  "duration" INTEGER DEFAULT 90,
  "attendees" JSONB DEFAULT '[]',
  "agenda" JSONB DEFAULT '[]',
  "notes" TEXT,
  "todoIds" JSONB DEFAULT '[]',
  "issueIds" JSONB DEFAULT '[]',
  "status" TEXT DEFAULT 'scheduled' CHECK ("status" IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- ScorecardMetric
-- -----------------------------
CREATE TABLE "ScorecardMetric" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "owner" TEXT NOT NULL,
  "unit" TEXT DEFAULT 'number',
  "goal" NUMERIC NOT NULL,
  "direction" TEXT DEFAULT 'above' CHECK ("direction" IN ('above', 'below', 'exact')),
  "frequency" TEXT DEFAULT 'weekly' CHECK ("frequency" IN ('daily', 'weekly', 'monthly', 'quarterly')),
  "isActive" BOOLEAN DEFAULT true,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- ScorecardEntry
-- -----------------------------
CREATE TABLE "ScorecardEntry" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "metricId" TEXT NOT NULL REFERENCES "ScorecardMetric"("id") ON DELETE CASCADE,
  "value" NUMERIC NOT NULL,
  "date" DATE NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("metricId", "date")
);

-- -----------------------------
-- PeopleAnalyzer
-- -----------------------------
CREATE TABLE "PeopleAnalyzer" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "teamMemberId" TEXT NOT NULL REFERENCES "TeamMember"("id") ON DELETE CASCADE,
  "seatId" TEXT REFERENCES "Seat"("id") ON DELETE SET NULL,
  "coreValuesScore" JSONB DEFAULT '{}',
  "gwtScore" JSONB DEFAULT '{"getsIt": null, "wantsIt": null, "capacityToDoIt": null}',
  "overallRating" TEXT CHECK ("overallRating" IN ('right_person_right_seat', 'right_person_wrong_seat', 'wrong_person_right_seat', 'wrong_person_wrong_seat', 'pending')),
  "notes" TEXT,
  "evaluatedAt" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- RoomPrice
-- -----------------------------
CREATE TABLE "RoomPrice" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "roomType" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "basePrice" NUMERIC NOT NULL,
  "laborHours" NUMERIC,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- ExteriorPrice
-- -----------------------------
CREATE TABLE "ExteriorPrice" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "exteriorType" TEXT NOT NULL,
  "size" TEXT NOT NULL,
  "basePrice" NUMERIC NOT NULL,
  "laborHours" NUMERIC,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Addon
-- -----------------------------
CREATE TABLE "Addon" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "price" NUMERIC NOT NULL,
  "unit" TEXT DEFAULT 'each',
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- PortfolioImage
-- -----------------------------
CREATE TABLE "PortfolioImage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "jobId" TEXT REFERENCES "Job"("id") ON DELETE SET NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "category" TEXT,
  "isFeatured" BOOLEAN DEFAULT false,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- AIConversation
-- -----------------------------
CREATE TABLE "AIConversation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "title" TEXT,
  "context" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- AIMessage
-- -----------------------------
CREATE TABLE "AIMessage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "conversationId" TEXT NOT NULL REFERENCES "AIConversation"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL CHECK ("role" IN ('user', 'assistant', 'system')),
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PART 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Organization indexes
CREATE INDEX "idx_organization_slug" ON "Organization"("slug");
CREATE INDEX "idx_organization_plan" ON "Organization"("plan");

-- User indexes
CREATE INDEX "idx_user_email" ON "User"("email");

-- UserOrganization indexes
CREATE INDEX "idx_userorg_user" ON "UserOrganization"("userId");
CREATE INDEX "idx_userorg_org" ON "UserOrganization"("organizationId");

-- Session indexes
CREATE INDEX "idx_session_token" ON "Session"("token");
CREATE INDEX "idx_session_user" ON "Session"("userId");
CREATE INDEX "idx_session_org" ON "Session"("organizationId");

-- Invitation indexes
CREATE INDEX "idx_invitation_token" ON "Invitation"("token");
CREATE INDEX "idx_invitation_email" ON "Invitation"("email");
CREATE INDEX "idx_invitation_org" ON "Invitation"("organizationId");

-- Multi-tenant table indexes (organizationId)
CREATE INDEX "idx_job_org" ON "Job"("organizationId");
CREATE INDEX "idx_job_status" ON "Job"("status");
CREATE INDEX "idx_job_dates" ON "Job"("startDate", "endDate");

CREATE INDEX "idx_lead_org" ON "Lead"("organizationId");
CREATE INDEX "idx_lead_status" ON "Lead"("status");

CREATE INDEX "idx_estimate_org" ON "Estimate"("organizationId");
CREATE INDEX "idx_estimate_status" ON "Estimate"("status");

CREATE INDEX "idx_weeklysales_org" ON "WeeklySales"("organizationId");
CREATE INDEX "idx_weeklysales_week" ON "WeeklySales"("weekStart");

CREATE INDEX "idx_marketingspend_org" ON "MarketingSpend"("organizationId");
CREATE INDEX "idx_marketingspend_period" ON "MarketingSpend"("year", "month");

CREATE INDEX "idx_rock_org" ON "Rock"("organizationId");
CREATE INDEX "idx_rock_quarter" ON "Rock"("quarter", "year");

CREATE INDEX "idx_knowledge_org" ON "KnowledgeArticle"("organizationId");
CREATE INDEX "idx_knowledge_category" ON "KnowledgeArticle"("category");

CREATE INDEX "idx_teammember_org" ON "TeamMember"("organizationId");
CREATE INDEX "idx_subcontractor_org" ON "Subcontractor"("organizationId");

-- ============================================
-- PART 4: ROW-LEVEL SECURITY (RLS)
-- ============================================

-- Helper function to get current organization ID from session context
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_organization_id', true), '')::TEXT;
$$ LANGUAGE SQL STABLE;

-- Enable RLS on all multi-tenant tables
ALTER TABLE "VTO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BusinessSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanyEstimateSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subcontractor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Estimate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeeklySales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MarketingSpend" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeArticle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Todo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Issue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Seat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Meeting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScorecardMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PeopleAnalyzer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoomPrice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExteriorPrice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Addon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortfolioImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AIConversation" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for each table
-- VTO
CREATE POLICY "vto_org_access" ON "VTO" FOR ALL USING ("organizationId" = get_current_org_id());

-- BusinessSettings
CREATE POLICY "settings_org_access" ON "BusinessSettings" FOR ALL USING ("organizationId" = get_current_org_id());

-- CompanyEstimateSettings
CREATE POLICY "estimate_settings_org_access" ON "CompanyEstimateSettings" FOR ALL USING ("organizationId" = get_current_org_id());

-- TeamMember
CREATE POLICY "team_org_access" ON "TeamMember" FOR ALL USING ("organizationId" = get_current_org_id());

-- Subcontractor
CREATE POLICY "subcontractor_org_access" ON "Subcontractor" FOR ALL USING ("organizationId" = get_current_org_id());

-- Lead
CREATE POLICY "lead_org_access" ON "Lead" FOR ALL USING ("organizationId" = get_current_org_id());

-- Estimate
CREATE POLICY "estimate_org_access" ON "Estimate" FOR ALL USING ("organizationId" = get_current_org_id());

-- Job
CREATE POLICY "job_org_access" ON "Job" FOR ALL USING ("organizationId" = get_current_org_id());

-- WeeklySales
CREATE POLICY "weeklysales_org_access" ON "WeeklySales" FOR ALL USING ("organizationId" = get_current_org_id());

-- MarketingSpend
CREATE POLICY "marketingspend_org_access" ON "MarketingSpend" FOR ALL USING ("organizationId" = get_current_org_id());

-- KnowledgeArticle
CREATE POLICY "knowledge_org_access" ON "KnowledgeArticle" FOR ALL USING ("organizationId" = get_current_org_id());

-- Rock
CREATE POLICY "rock_org_access" ON "Rock" FOR ALL USING ("organizationId" = get_current_org_id());

-- Todo
CREATE POLICY "todo_org_access" ON "Todo" FOR ALL USING ("organizationId" = get_current_org_id());

-- Issue
CREATE POLICY "issue_org_access" ON "Issue" FOR ALL USING ("organizationId" = get_current_org_id());

-- Seat
CREATE POLICY "seat_org_access" ON "Seat" FOR ALL USING ("organizationId" = get_current_org_id());

-- Meeting
CREATE POLICY "meeting_org_access" ON "Meeting" FOR ALL USING ("organizationId" = get_current_org_id());

-- ScorecardMetric
CREATE POLICY "scorecard_org_access" ON "ScorecardMetric" FOR ALL USING ("organizationId" = get_current_org_id());

-- PeopleAnalyzer
CREATE POLICY "people_org_access" ON "PeopleAnalyzer" FOR ALL USING ("organizationId" = get_current_org_id());

-- RoomPrice
CREATE POLICY "roomprice_org_access" ON "RoomPrice" FOR ALL USING ("organizationId" = get_current_org_id());

-- ExteriorPrice
CREATE POLICY "exteriorprice_org_access" ON "ExteriorPrice" FOR ALL USING ("organizationId" = get_current_org_id());

-- Addon
CREATE POLICY "addon_org_access" ON "Addon" FOR ALL USING ("organizationId" = get_current_org_id());

-- PortfolioImage
CREATE POLICY "portfolio_org_access" ON "PortfolioImage" FOR ALL USING ("organizationId" = get_current_org_id());

-- AIConversation
CREATE POLICY "ai_conv_org_access" ON "AIConversation" FOR ALL USING ("organizationId" = get_current_org_id());

-- ============================================
-- PART 5: BYPASS RLS FOR SERVICE ROLE
-- ============================================
-- Note: Service role automatically bypasses RLS in Supabase
-- This is needed for server-side operations

-- ============================================
-- PART 6: INSERT SAMPLE DATA FOR TESTING
-- ============================================

-- Create sample organization
INSERT INTO "Organization" ("id", "name", "slug", "email", "plan")
VALUES ('org_demo_001', 'Demo Painting Co', 'demo-painting', 'demo@paintpro.com', 'pro');

-- Create sample user
INSERT INTO "User" ("id", "email", "name", "passwordHash")
VALUES ('user_demo_001', 'admin@paintpro.com', 'Admin Demo', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.K7HvK8kK6k6K6k');

-- Link user to organization as owner
INSERT INTO "UserOrganization" ("userId", "organizationId", "role", "isDefault")
VALUES ('user_demo_001', 'org_demo_001', 'owner', true);

-- Create sample VTO
INSERT INTO "VTO" ("organizationId", "annualTarget", "formulaParams", "coreValues")
VALUES (
  'org_demo_001',
  1000000,
  '{"avgTicket": 3500, "closeRate": 0.35, "showRate": 0.70, "leadToEstimate": 0.85}',
  '["Qualidade", "Integridade", "Respeito", "Excelência"]'
);

-- Create sample business settings
INSERT INTO "BusinessSettings" ("organizationId", "companyName", "email", "phone", "marketingChannels")
VALUES (
  'org_demo_001',
  'Demo Painting Co',
  'contact@demo-painting.com',
  '(11) 99999-9999',
  '[{"id": "meta", "label": "Meta Ads", "color": "#1877F2"}, {"id": "google", "label": "Google Ads", "color": "#EA4335"}, {"id": "indicacao", "label": "Indicação", "color": "#10B981"}, {"id": "organico", "label": "Orgânico", "color": "#8B5CF6"}]'
);

-- Create sample subcontractors
INSERT INTO "Subcontractor" ("organizationId", "name", "specialty", "color", "phone")
VALUES
  ('org_demo_001', 'João Pintor', 'Pintura Interna', '#3B82F6', '(11) 98888-1111'),
  ('org_demo_001', 'Carlos Exterior', 'Pintura Externa', '#10B981', '(11) 98888-2222'),
  ('org_demo_001', 'Maria Decoradora', 'Textura e Efeitos', '#8B5CF6', '(11) 98888-3333');

-- Create sample jobs
INSERT INTO "Job" ("organizationId", "title", "clientName", "address", "city", "state", "status", "startDate", "endDate", "revenue")
VALUES
  ('org_demo_001', 'Pintura Residencial - Casa Completa', 'Fernando Silva', 'Rua das Flores, 123', 'São Paulo', 'SP', 'completed', '2024-12-01', '2024-12-05', 8500),
  ('org_demo_001', 'Pintura Comercial - Escritório', 'Empresa ABC', 'Av. Paulista, 1000', 'São Paulo', 'SP', 'in_progress', '2024-12-15', '2024-12-20', 12000),
  ('org_demo_001', 'Pintura Externa - Fachada', 'Condomínio Vista', 'Rua dos Pinheiros, 500', 'São Paulo', 'SP', 'scheduled', '2024-12-22', '2024-12-28', 25000);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Count sample data
SELECT 'Organizations' as entity, COUNT(*) as count FROM "Organization"
UNION ALL
SELECT 'Users', COUNT(*) FROM "User"
UNION ALL
SELECT 'UserOrganizations', COUNT(*) FROM "UserOrganization"
UNION ALL
SELECT 'Jobs', COUNT(*) FROM "Job"
UNION ALL
SELECT 'Subcontractors', COUNT(*) FROM "Subcontractor";

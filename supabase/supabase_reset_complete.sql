-- ============================================
-- PaintPro - Reset Completo do Banco de Dados
-- Schema Painting Contractor + Multi-Tenancy
-- Version: 5.0
-- Data: 2024-12-22
-- ============================================
--
-- INSTRUCOES:
-- 1. Acesse Supabase Dashboard > SQL Editor
-- 2. Cole todo este conteudo
-- 3. Clique em "Run"
-- 4. Verifique se todas as tabelas foram criadas
--
-- ATENCAO: Este script APAGA TODOS OS DADOS existentes!
-- ============================================

-- ============================================
-- PARTE 1: DROP ALL EXISTING TABLES
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
DROP TABLE IF EXISTS "Job" CASCADE;
DROP TABLE IF EXISTS "Estimate" CASCADE;
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
-- PARTE 2: CREATE TABLES
-- ============================================

-- -----------------------------
-- Organization (Multi-tenant Core)
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
-- User (Auth - No organizationId)
-- -----------------------------
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT DEFAULT 'user' CHECK ("role" IN ('admin', 'user', 'viewer')),
  "avatar" TEXT,
  "phone" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "emailVerified" BOOLEAN DEFAULT false,
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- UserOrganization (Junction Table)
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
-- Session (With organizationId)
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
-- Invitation
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
-- BusinessSettings (COM CAMPOS FINANCEIROS)
-- -----------------------------
CREATE TABLE "BusinessSettings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  -- Company Info
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
  -- Financial Settings (CRITICO)
  "subPayoutPct" NUMERIC DEFAULT 60,
  "subMaterialsPct" NUMERIC DEFAULT 15,
  "subLaborPct" NUMERIC DEFAULT 45,
  "minGrossProfitPerJob" NUMERIC DEFAULT 900,
  "targetGrossMarginPct" NUMERIC DEFAULT 40,
  "defaultDepositPct" NUMERIC DEFAULT 30,
  "arTargetDays" INTEGER DEFAULT 7,
  "priceRoundingIncrement" NUMERIC DEFAULT 50,
  -- Marketing Channels
  "marketingChannels" JSONB DEFAULT '[{"id": "meta", "label": "Meta Ads", "color": "#1877F2"}, {"id": "google", "label": "Google Ads", "color": "#EA4335"}, {"id": "indicacao", "label": "Indicacao", "color": "#10B981"}, {"id": "organico", "label": "Organico", "color": "#8B5CF6"}]',
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
  -- Insurance
  "insuranceCertificateUrl" TEXT,
  "insuranceCompany" TEXT,
  "insurancePolicyNumber" TEXT,
  "insuranceCoverageAmount" NUMERIC,
  "insuranceExpirationDate" TIMESTAMP,
  -- License
  "licenseImageUrl" TEXT,
  "licenseNumber" TEXT,
  "licenseState" TEXT,
  "licenseExpirationDate" TIMESTAMP,
  -- Terms
  "termsAndConditions" TEXT DEFAULT '',
  "paymentTerms" TEXT,
  "warrantyTerms" TEXT,
  -- Estimate Settings
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
-- TeamMember (COM defaultCommissionPct)
-- -----------------------------
CREATE TABLE "TeamMember" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "role" TEXT DEFAULT 'both' CHECK ("role" IN ('sales', 'pm', 'both')),
  "defaultCommissionPct" NUMERIC DEFAULT 5,
  "color" TEXT DEFAULT '#3B82F6',
  "avatar" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Subcontractor (COM defaultPayoutPct)
-- -----------------------------
CREATE TABLE "Subcontractor" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "companyName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "specialty" TEXT DEFAULT 'both' CHECK ("specialty" IN ('interior', 'exterior', 'both')),
  "defaultPayoutPct" NUMERIC DEFAULT 60,
  "color" TEXT DEFAULT '#10B981',
  "notes" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Lead (COM firstName, lastName)
-- -----------------------------
CREATE TABLE "Lead" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "source" TEXT,
  "status" TEXT DEFAULT 'new' CHECK ("status" IN ('new', 'contacted', 'estimate_scheduled', 'estimated', 'proposal_sent', 'follow_up', 'won', 'lost')),
  "projectType" TEXT DEFAULT 'interior' CHECK ("projectType" IN ('interior', 'exterior', 'both')),
  "leadDate" TIMESTAMP DEFAULT NOW(),
  "nextFollowupDate" TIMESTAMP,
  "estimatedJobValue" NUMERIC,
  "wonLostReason" TEXT,
  "notes" TEXT,
  "assignedToId" TEXT REFERENCES "TeamMember"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Estimate (COM campos de lucro)
-- -----------------------------
CREATE TABLE "Estimate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "estimateNumber" TEXT NOT NULL,
  "leadId" TEXT REFERENCES "Lead"("id") ON DELETE SET NULL,
  "clientName" TEXT NOT NULL,
  "clientEmail" TEXT,
  "clientPhone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "status" TEXT DEFAULT 'draft' CHECK ("status" IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  "estimateDate" TIMESTAMP DEFAULT NOW(),
  "validUntil" TIMESTAMP,
  -- Pricing
  "subtotal" NUMERIC DEFAULT 0,
  "discountAmount" NUMERIC DEFAULT 0,
  "totalPrice" NUMERIC DEFAULT 0,
  -- Cost Calculations (CRITICO)
  "subMaterialsCost" NUMERIC DEFAULT 0,
  "subLaborCost" NUMERIC DEFAULT 0,
  "subTotalCost" NUMERIC DEFAULT 0,
  -- Profit Calculations (CRITICO)
  "grossProfit" NUMERIC DEFAULT 0,
  "grossMarginPct" NUMERIC DEFAULT 0,
  "meetsMinGp" BOOLEAN DEFAULT false,
  "meetsTargetGm" BOOLEAN DEFAULT false,
  -- Notes
  "notes" TEXT,
  "terms" TEXT,
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
  "location" TEXT,
  "scope" TEXT CHECK ("scope" IN ('walls_only', 'walls_trim', 'walls_trim_ceiling', 'full_refresh')),
  "quantity" NUMERIC DEFAULT 1,
  "unitPrice" NUMERIC NOT NULL,
  "lineTotal" NUMERIC NOT NULL,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- EstimateSignature
-- -----------------------------
CREATE TABLE "EstimateSignature" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "clientName" TEXT NOT NULL,
  "signatureDataUrl" TEXT NOT NULL,
  "signedAt" TIMESTAMP DEFAULT NOW(),
  "ipAddress" TEXT
);

-- -----------------------------
-- Job (PAINTING CONTRACTOR - 30+ campos)
-- -----------------------------
CREATE TABLE "Job" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "jobNumber" TEXT NOT NULL,
  -- Client Info
  "clientName" TEXT NOT NULL,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "latitude" NUMERIC,
  "longitude" NUMERIC,
  -- Project Details
  "projectType" TEXT DEFAULT 'interior' CHECK ("projectType" IN ('interior', 'exterior', 'both')),
  "status" TEXT DEFAULT 'lead' CHECK ("status" IN ('lead', 'got_the_job', 'scheduled', 'completed')),
  -- Dates
  "jobDate" DATE DEFAULT CURRENT_DATE,
  "scheduledStartDate" DATE,
  "scheduledEndDate" DATE,
  "actualStartDate" DATE,
  "actualEndDate" DATE,
  -- Financial (CRITICO)
  "jobValue" NUMERIC DEFAULT 0,
  "subMaterials" NUMERIC DEFAULT 0,
  "subLabor" NUMERIC DEFAULT 0,
  "subTotal" NUMERIC DEFAULT 0,
  "grossProfit" NUMERIC DEFAULT 0,
  "grossMarginPct" NUMERIC DEFAULT 0,
  -- Deposit & Payment
  "depositRequired" NUMERIC DEFAULT 0,
  "depositPaid" BOOLEAN DEFAULT false,
  "balanceDue" NUMERIC DEFAULT 0,
  "jobPaid" BOOLEAN DEFAULT false,
  "invoiceDate" DATE,
  "paymentReceivedDate" DATE,
  "daysToCollect" INTEGER,
  -- Sales Commission
  "salesCommissionPct" NUMERIC DEFAULT 0,
  "salesCommissionAmount" NUMERIC DEFAULT 0,
  "salesCommissionPaid" BOOLEAN DEFAULT false,
  -- PM Commission
  "pmCommissionPct" NUMERIC DEFAULT 0,
  "pmCommissionAmount" NUMERIC DEFAULT 0,
  "pmCommissionPaid" BOOLEAN DEFAULT false,
  -- Subcontractor
  "subcontractorPrice" NUMERIC DEFAULT 0,
  "subcontractorPaid" BOOLEAN DEFAULT false,
  -- Profit Flags
  "meetsMinGp" BOOLEAN DEFAULT false,
  "meetsTargetGm" BOOLEAN DEFAULT false,
  "profitFlag" TEXT DEFAULT 'OK' CHECK ("profitFlag" IN ('OK', 'RAISE_PRICE', 'FIX_SCOPE')),
  -- Notes
  "notes" TEXT,
  -- Foreign Keys
  "leadId" TEXT REFERENCES "Lead"("id") ON DELETE SET NULL,
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE SET NULL,
  "salesRepId" TEXT REFERENCES "TeamMember"("id") ON DELETE SET NULL,
  "projectManagerId" TEXT REFERENCES "TeamMember"("id") ON DELETE SET NULL,
  "subcontractorId" TEXT REFERENCES "Subcontractor"("id") ON DELETE SET NULL,
  -- Timestamps
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  -- Constraints
  UNIQUE("organizationId", "jobNumber")
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
  "content" TEXT DEFAULT '',
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
  "rockType" TEXT DEFAULT 'company' CHECK ("rockType" IN ('company', 'individual')),
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
-- Todo
-- -----------------------------
CREATE TABLE "Todo" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "dueDate" DATE,
  "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'done')),
  "completedAt" TIMESTAMP,
  "rockId" TEXT REFERENCES "Rock"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Issue
-- -----------------------------
CREATE TABLE "Issue" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "issueType" TEXT DEFAULT 'short_term' CHECK ("issueType" IN ('short_term', 'long_term')),
  "priority" INTEGER DEFAULT 2 CHECK ("priority" BETWEEN 1 AND 3),
  "status" TEXT DEFAULT 'open' CHECK ("status" IN ('open', 'in_discussion', 'solved')),
  "createdBy" TEXT,
  "resolution" TEXT,
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
  "seatName" TEXT NOT NULL,
  "roleDescription" TEXT,
  "responsibilities" JSONB DEFAULT '[]',
  "personName" TEXT,
  "personId" TEXT,
  "reportsToId" TEXT REFERENCES "Seat"("id") ON DELETE SET NULL,
  "gwcGetsIt" BOOLEAN DEFAULT false,
  "gwcWantsIt" BOOLEAN DEFAULT false,
  "gwcCapacity" BOOLEAN DEFAULT false,
  "isRightPersonRightSeat" BOOLEAN DEFAULT false,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- Meeting
-- -----------------------------
CREATE TABLE "Meeting" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "title" TEXT,
  "meetingType" TEXT DEFAULT 'l10' CHECK ("meetingType" IN ('l10', 'quarterly', 'annual')),
  "meetingDate" TIMESTAMP NOT NULL,
  "duration" INTEGER DEFAULT 90,
  "attendees" JSONB DEFAULT '[]',
  "ratingAvg" NUMERIC,
  "segueNotes" TEXT,
  "headlines" TEXT,
  "notes" TEXT,
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
  "goalValue" NUMERIC NOT NULL,
  "goalType" TEXT DEFAULT 'number' CHECK ("goalType" IN ('number', 'currency', 'percent')),
  "goalDirection" TEXT DEFAULT 'above' CHECK ("goalDirection" IN ('above', 'below')),
  "category" TEXT DEFAULT 'leading' CHECK ("category" IN ('leading', 'lagging')),
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
  "weekEndingDate" TIMESTAMP NOT NULL,
  "actualValue" NUMERIC NOT NULL,
  "onTrack" BOOLEAN DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("metricId", "weekEndingDate")
);

-- -----------------------------
-- PeopleAnalyzer
-- -----------------------------
CREATE TABLE "PeopleAnalyzer" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "personName" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "reviewDate" TIMESTAMP DEFAULT NOW(),
  "coreValueRatings" JSONB DEFAULT '{}',
  "gwcGetsIt" BOOLEAN DEFAULT false,
  "gwcWantsIt" BOOLEAN DEFAULT false,
  "gwcCapacity" BOOLEAN DEFAULT false,
  "overallStatus" TEXT DEFAULT 'needs_work' CHECK ("overallStatus" IN ('right_person_right_seat', 'needs_work', 'wrong_fit')),
  "notes" TEXT,
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
  "typicalSqft" INTEGER DEFAULT 0,
  "wallsOnly" NUMERIC DEFAULT 0,
  "wallsTrim" NUMERIC DEFAULT 0,
  "wallsTrimCeiling" NUMERIC DEFAULT 0,
  "fullRefresh" NUMERIC DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- -----------------------------
-- ExteriorPrice
-- -----------------------------
CREATE TABLE "ExteriorPrice" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "surfaceType" TEXT NOT NULL,
  "pricePerSqft" NUMERIC NOT NULL,
  "prepMultiplier" NUMERIC DEFAULT 1.0,
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
  "category" TEXT DEFAULT 'both' CHECK ("category" IN ('interior', 'exterior', 'both')),
  "unit" TEXT DEFAULT 'each',
  "basePrice" NUMERIC NOT NULL,
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
  "beforeUrl" TEXT,
  "afterUrl" TEXT,
  "projectType" TEXT CHECK ("projectType" IN ('interior', 'exterior', 'both')),
  "description" TEXT,
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
  "sessionId" TEXT,
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
  "role" TEXT NOT NULL CHECK ("role" IN ('user', 'assistant')),
  "content" TEXT NOT NULL,
  "suggestedLineItems" JSONB,
  "suggestedRiskModifiers" JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PARTE 3: CREATE INDEXES
-- ============================================

-- Organization
CREATE INDEX "idx_organization_slug" ON "Organization"("slug");
CREATE INDEX "idx_organization_plan" ON "Organization"("plan");

-- User
CREATE INDEX "idx_user_email" ON "User"("email");

-- UserOrganization
CREATE INDEX "idx_userorg_user" ON "UserOrganization"("userId");
CREATE INDEX "idx_userorg_org" ON "UserOrganization"("organizationId");

-- Session
CREATE INDEX "idx_session_token" ON "Session"("token");
CREATE INDEX "idx_session_user" ON "Session"("userId");
CREATE INDEX "idx_session_org" ON "Session"("organizationId");

-- TeamMember
CREATE INDEX "idx_teammember_org" ON "TeamMember"("organizationId");
CREATE INDEX "idx_teammember_active" ON "TeamMember"("isActive");

-- Subcontractor
CREATE INDEX "idx_subcontractor_org" ON "Subcontractor"("organizationId");
CREATE INDEX "idx_subcontractor_active" ON "Subcontractor"("isActive");

-- Lead
CREATE INDEX "idx_lead_org" ON "Lead"("organizationId");
CREATE INDEX "idx_lead_status" ON "Lead"("status");

-- Estimate
CREATE INDEX "idx_estimate_org" ON "Estimate"("organizationId");
CREATE INDEX "idx_estimate_status" ON "Estimate"("status");

-- Job
CREATE INDEX "idx_job_org" ON "Job"("organizationId");
CREATE INDEX "idx_job_status" ON "Job"("status");
CREATE INDEX "idx_job_dates" ON "Job"("scheduledStartDate", "scheduledEndDate");
CREATE INDEX "idx_job_salesrep" ON "Job"("salesRepId");
CREATE INDEX "idx_job_pm" ON "Job"("projectManagerId");
CREATE INDEX "idx_job_sub" ON "Job"("subcontractorId");

-- WeeklySales
CREATE INDEX "idx_weeklysales_org" ON "WeeklySales"("organizationId");
CREATE INDEX "idx_weeklysales_week" ON "WeeklySales"("weekStart");

-- MarketingSpend
CREATE INDEX "idx_marketingspend_org" ON "MarketingSpend"("organizationId");
CREATE INDEX "idx_marketingspend_period" ON "MarketingSpend"("year", "month");

-- Rock
CREATE INDEX "idx_rock_org" ON "Rock"("organizationId");
CREATE INDEX "idx_rock_quarter" ON "Rock"("quarter", "year");

-- KnowledgeArticle
CREATE INDEX "idx_knowledge_org" ON "KnowledgeArticle"("organizationId");
CREATE INDEX "idx_knowledge_category" ON "KnowledgeArticle"("category");

-- ============================================
-- PARTE 4: ROW-LEVEL SECURITY (RLS)
-- ============================================

-- Helper function
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_organization_id', true), '')::TEXT;
$$ LANGUAGE SQL STABLE;

-- Enable RLS on multi-tenant tables
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

-- Create RLS policies
CREATE POLICY "vto_org_access" ON "VTO" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "settings_org_access" ON "BusinessSettings" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "estimate_settings_org_access" ON "CompanyEstimateSettings" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "team_org_access" ON "TeamMember" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "subcontractor_org_access" ON "Subcontractor" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "lead_org_access" ON "Lead" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "estimate_org_access" ON "Estimate" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "job_org_access" ON "Job" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "weeklysales_org_access" ON "WeeklySales" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "marketingspend_org_access" ON "MarketingSpend" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "knowledge_org_access" ON "KnowledgeArticle" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "rock_org_access" ON "Rock" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "todo_org_access" ON "Todo" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "issue_org_access" ON "Issue" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "seat_org_access" ON "Seat" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "meeting_org_access" ON "Meeting" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "scorecard_org_access" ON "ScorecardMetric" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "people_org_access" ON "PeopleAnalyzer" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "roomprice_org_access" ON "RoomPrice" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "exteriorprice_org_access" ON "ExteriorPrice" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "addon_org_access" ON "Addon" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "portfolio_org_access" ON "PortfolioImage" FOR ALL USING ("organizationId" = get_current_org_id());
CREATE POLICY "ai_conv_org_access" ON "AIConversation" FOR ALL USING ("organizationId" = get_current_org_id());

-- ============================================
-- PARTE 5: SAMPLE DATA
-- ============================================

-- Create demo organization
INSERT INTO "Organization" ("id", "name", "slug", "email", "phone", "plan")
VALUES ('org_demo_001', 'Demo Painting Co', 'demo-painting', 'demo@paintpro.com', '(11) 99999-9999', 'pro');

-- Create demo user (password: demo123)
INSERT INTO "User" ("id", "email", "name", "passwordHash", "role")
VALUES ('user_demo_001', 'admin@paintpro.com', 'Admin Demo', 'pp_demo123', 'admin');

-- Link user to organization as owner
INSERT INTO "UserOrganization" ("userId", "organizationId", "role", "isDefault")
VALUES ('user_demo_001', 'org_demo_001', 'owner', true);

-- Create VTO
INSERT INTO "VTO" ("organizationId", "annualTarget", "coreValues")
VALUES ('org_demo_001', 1000000, '["Qualidade", "Integridade", "Respeito"]');

-- Create BusinessSettings with financial defaults
INSERT INTO "BusinessSettings" (
  "organizationId",
  "companyName",
  "email",
  "phone",
  "subPayoutPct",
  "subMaterialsPct",
  "subLaborPct",
  "minGrossProfitPerJob",
  "targetGrossMarginPct",
  "defaultDepositPct",
  "arTargetDays"
)
VALUES (
  'org_demo_001',
  'Demo Painting Co',
  'contact@demo-painting.com',
  '(11) 99999-9999',
  60,
  15,
  45,
  900,
  40,
  30,
  7
);

-- Create sample team members
INSERT INTO "TeamMember" ("organizationId", "name", "email", "role", "defaultCommissionPct", "color")
VALUES
  ('org_demo_001', 'Carlos Vendedor', 'carlos@demo.com', 'sales', 5, '#3B82F6'),
  ('org_demo_001', 'Maria PM', 'maria@demo.com', 'pm', 5, '#8B5CF6'),
  ('org_demo_001', 'Joao Both', 'joao@demo.com', 'both', 5, '#F97316');

-- Create sample subcontractors
INSERT INTO "Subcontractor" ("organizationId", "name", "specialty", "defaultPayoutPct", "color", "phone")
VALUES
  ('org_demo_001', 'Pedro Pintor', 'interior', 60, '#10B981', '(11) 98888-1111'),
  ('org_demo_001', 'Andre Exterior', 'exterior', 55, '#3B82F6', '(11) 98888-2222'),
  ('org_demo_001', 'Marcos Geral', 'both', 60, '#8B5CF6', '(11) 98888-3333');

-- Create sample jobs
INSERT INTO "Job" (
  "organizationId",
  "jobNumber",
  "clientName",
  "address",
  "city",
  "status",
  "jobValue",
  "grossProfit",
  "grossMarginPct"
)
VALUES
  ('org_demo_001', 'JOB-1001', 'Fernando Silva', 'Rua das Flores, 123', 'Sao Paulo', 'completed', 8500, 3400, 40),
  ('org_demo_001', 'JOB-1002', 'Empresa ABC', 'Av. Paulista, 1000', 'Sao Paulo', 'scheduled', 12000, 4800, 40),
  ('org_demo_001', 'JOB-1003', 'Condominio Vista', 'Rua dos Pinheiros, 500', 'Sao Paulo', 'lead', 25000, 10000, 40);

-- ============================================
-- PARTE 6: VERIFICATION
-- ============================================

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count sample data
SELECT 'Organizations' as entity, COUNT(*) as count FROM "Organization"
UNION ALL
SELECT 'Users', COUNT(*) FROM "User"
UNION ALL
SELECT 'TeamMembers', COUNT(*) FROM "TeamMember"
UNION ALL
SELECT 'Subcontractors', COUNT(*) FROM "Subcontractor"
UNION ALL
SELECT 'Jobs', COUNT(*) FROM "Job";

-- ============================================
-- FIM DO SCRIPT
-- ============================================
--
-- Proximos passos:
-- 1. Acesse a aplicacao
-- 2. Faca login com: admin@paintpro.com / demo123
-- 3. Teste criar TeamMember
-- 4. Teste criar Subcontractor
-- 5. Teste criar Job
-- ============================================

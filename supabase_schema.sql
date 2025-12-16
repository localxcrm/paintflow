-- PaintPro Database Schema for Supabase
-- Generated from Prisma schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE "UserRole" AS ENUM ('admin', 'user', 'viewer');
CREATE TYPE "TeamRole" AS ENUM ('sales', 'pm', 'both');
CREATE TYPE "SubcontractorType" AS ENUM ('interior', 'exterior', 'both');
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'estimate_scheduled', 'estimated', 'proposal_sent', 'follow_up', 'won', 'lost');
CREATE TYPE "ProjectType" AS ENUM ('interior', 'exterior', 'both');
CREATE TYPE "EstimateStatus" AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired');
CREATE TYPE "Scope" AS ENUM ('walls_only', 'walls_trim', 'walls_trim_ceiling', 'full_refresh');
CREATE TYPE "JobStatus" AS ENUM ('lead', 'got_the_job', 'scheduled', 'completed');
CREATE TYPE "ProfitFlag" AS ENUM ('OK', 'RAISE_PRICE', 'FIX_SCOPE');
CREATE TYPE "AddonCategory" AS ENUM ('interior', 'exterior', 'both');
CREATE TYPE "RockType" AS ENUM ('company', 'individual');
CREATE TYPE "RockStatus" AS ENUM ('on_track', 'off_track', 'complete', 'dropped');
CREATE TYPE "TodoStatus" AS ENUM ('pending', 'done');
CREATE TYPE "IssueType" AS ENUM ('short_term', 'long_term');
CREATE TYPE "IssueStatus" AS ENUM ('open', 'in_discussion', 'solved');
CREATE TYPE "MeetingType" AS ENUM ('l10', 'quarterly', 'annual');
CREATE TYPE "GoalType" AS ENUM ('number', 'currency', 'percent');
CREATE TYPE "GoalDirection" AS ENUM ('above', 'below');
CREATE TYPE "MetricCategory" AS ENUM ('leading', 'lagging');
CREATE TYPE "PersonStatus" AS ENUM ('right_person_right_seat', 'needs_work', 'wrong_fit');
CREATE TYPE "AIRole" AS ENUM ('user', 'assistant');

-- ============================================
-- USER AUTHENTICATION
-- ============================================

CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- BUSINESS SETTINGS
-- ============================================

CREATE TABLE "BusinessSettings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "subPayoutPct" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "subMaterialsPct" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "subLaborPct" DOUBLE PRECISION NOT NULL DEFAULT 45,
    "minGrossProfitPerJob" DOUBLE PRECISION NOT NULL DEFAULT 900,
    "targetGrossMarginPct" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "defaultDepositPct" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "arTargetDays" INTEGER NOT NULL DEFAULT 7,
    "priceRoundingIncrement" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- TEAM & SUBCONTRACTORS
-- ============================================

CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "TeamRole" NOT NULL DEFAULT 'both',
    "defaultCommissionPct" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subcontractor" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "specialty" "SubcontractorType" NOT NULL DEFAULT 'both',
    "defaultPayoutPct" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subcontractor_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- LEADS / CRM
-- ============================================

CREATE TABLE "Lead" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "projectType" "ProjectType" NOT NULL DEFAULT 'interior',
    "leadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextFollowupDate" TIMESTAMP(3),
    "estimatedJobValue" DOUBLE PRECISION,
    "wonLostReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedToId" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- ESTIMATES
-- ============================================

CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "estimateNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" "EstimateStatus" NOT NULL DEFAULT 'draft',
    "estimateDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subMaterialsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subLaborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subTotalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossMarginPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "meetsMinGp" BOOLEAN NOT NULL DEFAULT false,
    "meetsTargetGm" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT,

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EstimateLineItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "scope" "Scope",
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "lineTotal" DOUBLE PRECISION NOT NULL,
    "estimateId" TEXT NOT NULL,

    CONSTRAINT "EstimateLineItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EstimateSignature" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "clientName" TEXT NOT NULL,
    "signatureDataUrl" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "estimateId" TEXT NOT NULL,

    CONSTRAINT "EstimateSignature_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- JOBS
-- ============================================

CREATE TABLE "Job" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "jobNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "projectType" "ProjectType" NOT NULL DEFAULT 'interior',
    "status" "JobStatus" NOT NULL DEFAULT 'lead',
    "jobDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledStartDate" TIMESTAMP(3),
    "scheduledEndDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "jobValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subMaterials" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subLabor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossMarginPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositRequired" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "jobPaid" BOOLEAN NOT NULL DEFAULT false,
    "balanceDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invoiceDate" TIMESTAMP(3),
    "paymentReceivedDate" TIMESTAMP(3),
    "daysToCollect" INTEGER,
    "salesCommissionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salesCommissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salesCommissionPaid" BOOLEAN NOT NULL DEFAULT false,
    "pmCommissionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pmCommissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pmCommissionPaid" BOOLEAN NOT NULL DEFAULT false,
    "subcontractorPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subcontractorPaid" BOOLEAN NOT NULL DEFAULT false,
    "meetsMinGp" BOOLEAN NOT NULL DEFAULT false,
    "meetsTargetGm" BOOLEAN NOT NULL DEFAULT false,
    "profitFlag" "ProfitFlag" NOT NULL DEFAULT 'OK',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT,
    "estimateId" TEXT,
    "salesRepId" TEXT,
    "projectManagerId" TEXT,
    "subcontractorId" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- PRICE BOOK
-- ============================================

CREATE TABLE "RoomPrice" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "roomType" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "typicalSqft" INTEGER NOT NULL,
    "wallsOnly" DOUBLE PRECISION NOT NULL,
    "wallsTrim" DOUBLE PRECISION NOT NULL,
    "wallsTrimCeiling" DOUBLE PRECISION NOT NULL,
    "fullRefresh" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExteriorPrice" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "surfaceType" TEXT NOT NULL,
    "pricePerSqft" DOUBLE PRECISION NOT NULL,
    "prepMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExteriorPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Addon" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "category" "AddonCategory" NOT NULL DEFAULT 'both',
    "unit" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- EOS / TRACTION
-- ============================================

CREATE TABLE "VTO" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "coreValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coreFocusPurpose" TEXT NOT NULL DEFAULT '',
    "coreFocusNiche" TEXT NOT NULL DEFAULT '',
    "tenYearTarget" TEXT NOT NULL DEFAULT '',
    "threeYearRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "threeYearProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "threeYearPicture" TEXT NOT NULL DEFAULT '',
    "oneYearRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oneYearProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oneYearGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetMarket" TEXT NOT NULL DEFAULT '',
    "threeUniques" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provenProcess" TEXT NOT NULL DEFAULT '',
    "guarantee" TEXT NOT NULL DEFAULT '',
    "longTermIssues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VTO_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rock" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT NOT NULL,
    "rockType" "RockType" NOT NULL DEFAULT 'individual',
    "quarter" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "RockStatus" NOT NULL DEFAULT 'on_track',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Todo" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "title" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "TodoStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Issue" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "issueType" "IssueType" NOT NULL DEFAULT 'short_term',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "status" "IssueStatus" NOT NULL DEFAULT 'open',
    "createdBy" TEXT NOT NULL,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Seat" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "seatName" TEXT NOT NULL,
    "roleDescription" TEXT NOT NULL,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "personName" TEXT,
    "personId" TEXT,
    "reportsToId" TEXT,
    "gwcGetsIt" BOOLEAN NOT NULL DEFAULT true,
    "gwcWantsIt" BOOLEAN NOT NULL DEFAULT true,
    "gwcCapacity" BOOLEAN NOT NULL DEFAULT true,
    "isRightPersonRightSeat" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "meetingType" "MeetingType" NOT NULL DEFAULT 'l10',
    "attendees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "segueNotes" TEXT,
    "headlines" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScorecardMetric" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "goalValue" DOUBLE PRECISION NOT NULL,
    "goalType" "GoalType" NOT NULL DEFAULT 'number',
    "goalDirection" "GoalDirection" NOT NULL DEFAULT 'above',
    "category" "MetricCategory" NOT NULL DEFAULT 'leading',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScorecardMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScorecardEntry" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "weekEndingDate" TIMESTAMP(3) NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "onTrack" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metricId" TEXT NOT NULL,

    CONSTRAINT "ScorecardEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PeopleAnalyzer" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "personName" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coreValueRatings" JSONB NOT NULL DEFAULT '{}',
    "gwcGetsIt" BOOLEAN NOT NULL DEFAULT true,
    "gwcWantsIt" BOOLEAN NOT NULL DEFAULT true,
    "gwcCapacity" BOOLEAN NOT NULL DEFAULT true,
    "overallStatus" "PersonStatus" NOT NULL DEFAULT 'right_person_right_seat',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeopleAnalyzer_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- COMPANY SETTINGS FOR ESTIMATES
-- ============================================

CREATE TABLE "CompanyEstimateSettings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "insuranceCertificateUrl" TEXT,
    "insuranceCompany" TEXT,
    "insurancePolicyNumber" TEXT,
    "insuranceCoverageAmount" DOUBLE PRECISION,
    "insuranceExpirationDate" TIMESTAMP(3),
    "licenseImageUrl" TEXT,
    "licenseNumber" TEXT,
    "licenseState" TEXT,
    "licenseExpirationDate" TIMESTAMP(3),
    "termsAndConditions" TEXT NOT NULL DEFAULT '',
    "paymentTerms" TEXT,
    "warrantyTerms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyEstimateSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortfolioImage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "beforeUrl" TEXT NOT NULL,
    "afterUrl" TEXT NOT NULL,
    "projectType" "ProjectType" NOT NULL DEFAULT 'interior',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioImage_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- AI ASSISTANT
-- ============================================

CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "role" "AIRole" NOT NULL,
    "content" TEXT NOT NULL,
    "suggestedLineItems" JSONB,
    "suggestedRiskModifiers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT NOT NULL,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- UNIQUE CONSTRAINTS
-- ============================================

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember"("email");
CREATE UNIQUE INDEX "Subcontractor_email_key" ON "Subcontractor"("email");
CREATE UNIQUE INDEX "Estimate_estimateNumber_key" ON "Estimate"("estimateNumber");
CREATE UNIQUE INDEX "EstimateSignature_estimateId_key" ON "EstimateSignature"("estimateId");
CREATE UNIQUE INDEX "Job_jobNumber_key" ON "Job"("jobNumber");
CREATE UNIQUE INDEX "Job_estimateId_key" ON "Job"("estimateId");
CREATE UNIQUE INDEX "RoomPrice_roomType_size_key" ON "RoomPrice"("roomType", "size");
CREATE UNIQUE INDEX "ExteriorPrice_surfaceType_key" ON "ExteriorPrice"("surfaceType");
CREATE UNIQUE INDEX "Addon_name_key" ON "Addon"("name");
CREATE UNIQUE INDEX "ScorecardEntry_metricId_weekEndingDate_key" ON "ScorecardEntry"("metricId", "weekEndingDate");

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Session_token_idx" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_leadDate_idx" ON "Lead"("leadDate");
CREATE INDEX "Estimate_status_idx" ON "Estimate"("status");
CREATE INDEX "Estimate_estimateDate_idx" ON "Estimate"("estimateDate");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_jobDate_idx" ON "Job"("jobDate");
CREATE INDEX "Rock_quarter_year_idx" ON "Rock"("quarter", "year");
CREATE INDEX "Rock_owner_idx" ON "Rock"("owner");
CREATE INDEX "Todo_owner_idx" ON "Todo"("owner");
CREATE INDEX "Todo_status_idx" ON "Todo"("status");
CREATE INDEX "Issue_issueType_idx" ON "Issue"("issueType");
CREATE INDEX "Issue_status_idx" ON "Issue"("status");
CREATE INDEX "Meeting_meetingDate_idx" ON "Meeting"("meetingDate");
CREATE INDEX "ScorecardMetric_owner_idx" ON "ScorecardMetric"("owner");
CREATE INDEX "ScorecardEntry_weekEndingDate_idx" ON "ScorecardEntry"("weekEndingDate");
CREATE INDEX "PeopleAnalyzer_personId_idx" ON "PeopleAnalyzer"("personId");
CREATE INDEX "AIConversation_sessionId_idx" ON "AIConversation"("sessionId");

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EstimateLineItem" ADD CONSTRAINT "EstimateLineItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EstimateSignature" ADD CONSTRAINT "EstimateSignature_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_reportsToId_fkey" FOREIGN KEY ("reportsToId") REFERENCES "Seat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScorecardEntry" ADD CONSTRAINT "ScorecardEntry_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "ScorecardMetric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_user BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_business_settings BEFORE UPDATE ON "BusinessSettings" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_team_member BEFORE UPDATE ON "TeamMember" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_subcontractor BEFORE UPDATE ON "Subcontractor" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_lead BEFORE UPDATE ON "Lead" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_estimate BEFORE UPDATE ON "Estimate" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_room_price BEFORE UPDATE ON "RoomPrice" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_exterior_price BEFORE UPDATE ON "ExteriorPrice" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_addon BEFORE UPDATE ON "Addon" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_vto BEFORE UPDATE ON "VTO" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_rock BEFORE UPDATE ON "Rock" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_todo BEFORE UPDATE ON "Todo" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_issue BEFORE UPDATE ON "Issue" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_seat BEFORE UPDATE ON "Seat" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_meeting BEFORE UPDATE ON "Meeting" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_scorecard_metric BEFORE UPDATE ON "ScorecardMetric" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_people_analyzer BEFORE UPDATE ON "PeopleAnalyzer" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_company_estimate_settings BEFORE UPDATE ON "CompanyEstimateSettings" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_job BEFORE UPDATE ON "Job" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

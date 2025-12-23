-- PaintPro Database Schema for Supabase
-- Version 2.0 - Updated with Jobs features
-- Run supabase_reset.sql first if you need to reset

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE "UserRole" AS ENUM ('admin', 'user', 'viewer');
CREATE TYPE "TeamRole" AS ENUM ('sales', 'pm', 'both');
CREATE TYPE "SubcontractorType" AS ENUM ('interior', 'exterior', 'both');
CREATE TYPE "ProjectType" AS ENUM ('interior', 'exterior', 'both');
CREATE TYPE "JobStatus" AS ENUM ('lead', 'got_the_job', 'scheduled', 'completed');
CREATE TYPE "ProfitFlag" AS ENUM ('OK', 'RAISE_PRICE', 'FIX_SCOPE');
CREATE TYPE "RockStatus" AS ENUM ('on_track', 'off_track', 'complete', 'dropped');
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'check', 'venmo', 'zelle', 'credit_card', 'bank_transfer', 'other');
CREATE TYPE "PaymentType" AS ENUM ('deposit', 'final_payment', 'sales_commission', 'pm_commission', 'subcontractor');
CREATE TYPE "PhotoType" AS ENUM ('before', 'after', 'progress');

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
    "jobDate" DATE NOT NULL DEFAULT CURRENT_DATE,
    "scheduledStartDate" DATE,
    "scheduledEndDate" DATE,
    "actualStartDate" DATE,
    "actualEndDate" DATE,
    
    -- Financial
    "jobValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subMaterials" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subLabor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossMarginPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    
    -- Client Payment
    "depositRequired" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "depositPaymentMethod" "PaymentMethod",
    "depositPaymentDate" DATE,
    "jobPaid" BOOLEAN NOT NULL DEFAULT false,
    "jobPaymentMethod" "PaymentMethod",
    "jobPaymentDate" DATE,
    "balanceDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invoiceDate" DATE,
    "paymentReceivedDate" DATE,
    "daysToCollect" INTEGER,
    
    -- Commissions
    "salesCommissionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salesCommissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salesCommissionPaid" BOOLEAN NOT NULL DEFAULT false,
    "pmCommissionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pmCommissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pmCommissionPaid" BOOLEAN NOT NULL DEFAULT false,
    
    -- Subcontractor
    "subcontractorPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subcontractorPaid" BOOLEAN NOT NULL DEFAULT false,
    
    -- Profit Flags
    "meetsMinGp" BOOLEAN NOT NULL DEFAULT false,
    "meetsTargetGm" BOOLEAN NOT NULL DEFAULT false,
    "profitFlag" "ProfitFlag" NOT NULL DEFAULT 'OK',
    
    -- Notes
    "notes" TEXT,
    
    -- Foreign Keys
    "salesRepId" TEXT,
    "projectManagerId" TEXT,
    "subcontractorId" TEXT,
    
    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- Job Photos
CREATE TABLE "JobPhoto" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "jobId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "PhotoType" NOT NULL DEFAULT 'before',
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPhoto_pkey" PRIMARY KEY ("id")
);

-- Payment History
CREATE TABLE "PaymentHistory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "jobId" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "type" "PaymentType" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- MARKETING
-- ============================================

CREATE TABLE "MarketingSpend" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "source" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL, -- Format: "2024-01"
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingSpend_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- KNOWLEDGE BASE (SOPs)
-- ============================================

CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'FileText',
    "content" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- ROCKS (EOS/Traction)
-- ============================================

CREATE TABLE "Rock" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "RockStatus" NOT NULL DEFAULT 'on_track',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rock_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- VTO (Vision Traction Organizer)
-- ============================================

CREATE TABLE "VTO" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "annualTarget" DOUBLE PRECISION NOT NULL DEFAULT 1000000,
    "avgTicket" DOUBLE PRECISION NOT NULL DEFAULT 9500,
    "closingRate" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "marketingPercent" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "productionWeeks" INTEGER NOT NULL DEFAULT 35,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VTO_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- UNIQUE CONSTRAINTS & INDEXES
-- ============================================

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember"("email");
CREATE UNIQUE INDEX "Subcontractor_email_key" ON "Subcontractor"("email");
CREATE UNIQUE INDEX "Job_jobNumber_key" ON "Job"("jobNumber");
CREATE UNIQUE INDEX "MarketingSpend_source_monthYear_key" ON "MarketingSpend"("source", "monthYear");

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_jobDate_idx" ON "Job"("jobDate");
CREATE INDEX "Job_salesRepId_idx" ON "Job"("salesRepId");
CREATE INDEX "Job_projectManagerId_idx" ON "Job"("projectManagerId");
CREATE INDEX "JobPhoto_jobId_idx" ON "JobPhoto"("jobId");
CREATE INDEX "PaymentHistory_jobId_idx" ON "PaymentHistory"("jobId");
CREATE INDEX "Rock_quarter_year_idx" ON "Rock"("quarter", "year");
CREATE INDEX "KnowledgeArticle_category_idx" ON "KnowledgeArticle"("category");

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "Job" ADD CONSTRAINT "Job_salesRepId_fkey" 
    FOREIGN KEY ("salesRepId") REFERENCES "TeamMember"("id") ON DELETE SET NULL;

ALTER TABLE "Job" ADD CONSTRAINT "Job_projectManagerId_fkey" 
    FOREIGN KEY ("projectManagerId") REFERENCES "TeamMember"("id") ON DELETE SET NULL;

ALTER TABLE "Job" ADD CONSTRAINT "Job_subcontractorId_fkey" 
    FOREIGN KEY ("subcontractorId") REFERENCES "Subcontractor"("id") ON DELETE SET NULL;

ALTER TABLE "JobPhoto" ADD CONSTRAINT "JobPhoto_jobId_fkey" 
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE;

ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_jobId_fkey" 
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE;

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
CREATE TRIGGER set_timestamp_job BEFORE UPDATE ON "Job" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_marketing_spend BEFORE UPDATE ON "MarketingSpend" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_knowledge_article BEFORE UPDATE ON "KnowledgeArticle" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_rock BEFORE UPDATE ON "Rock" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_vto BEFORE UPDATE ON "VTO" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================
-- SEED DATA
-- ============================================

-- Default Business Settings
INSERT INTO "BusinessSettings" ("id") VALUES ('default');

-- Default VTO
INSERT INTO "VTO" ("id") VALUES ('default');

-- Sample Team Members
INSERT INTO "TeamMember" ("id", "name", "email", "role", "defaultCommissionPct") VALUES
('tm-1', 'Mike Johnson', 'mike@paintpro.com', 'sales', 5),
('tm-2', 'Sarah Williams', 'sarah@paintpro.com', 'pm', 3),
('tm-3', 'Tom Brown', 'tom@paintpro.com', 'both', 4);

-- Sample Subcontractors
INSERT INTO "Subcontractor" ("id", "name", "email", "specialty", "defaultPayoutPct") VALUES
('sub-1', 'Pro Painters LLC', 'contact@propainters.com', 'both', 60),
('sub-2', 'Interior Experts', 'info@interiorexperts.com', 'interior', 55),
('sub-3', 'Exterior Masters', 'hello@exteriormasters.com', 'exterior', 58);

-- Sample Jobs
INSERT INTO "Job" (
    "id", "jobNumber", "clientName", "address", "city", "projectType", "status",
    "jobDate", "scheduledStartDate", "scheduledEndDate",
    "jobValue", "subMaterials", "subLabor", "subTotal", "grossProfit", "grossMarginPct",
    "depositRequired", "depositPaid", "balanceDue",
    "salesCommissionPct", "salesCommissionAmount",
    "pmCommissionPct", "pmCommissionAmount",
    "subcontractorPrice",
    "meetsMinGp", "meetsTargetGm", "profitFlag",
    "salesRepId", "projectManagerId", "subcontractorId"
) VALUES
('job-1', 'JOB-001', 'João Silva', '123 Main St', 'Boston', 'interior', 'completed',
 '2024-12-01', '2024-12-05', '2024-12-07',
 8500, 1275, 3825, 5100, 3400, 40,
 2550, true, 0,
 5, 425, 3, 255, 5100,
 true, true, 'OK',
 'tm-1', 'tm-2', 'sub-1'),
 
('job-2', 'JOB-002', 'Maria Santos', '456 Oak Ave', 'Cambridge', 'exterior', 'scheduled',
 '2024-12-10', '2024-12-15', '2024-12-18',
 12000, 1800, 5400, 7200, 4800, 40,
 3600, true, 8400,
 5, 600, 3, 360, 7200,
 true, true, 'OK',
 'tm-1', 'tm-2', 'sub-3'),

('job-3', 'JOB-003', 'Carlos Lima', '789 Pine Rd', 'Somerville', 'both', 'got_the_job',
 '2024-12-15', '2024-12-20', '2024-12-25',
 15000, 2250, 6750, 9000, 6000, 40,
 4500, false, 15000,
 5, 750, 3, 450, 9000,
 true, true, 'OK',
 'tm-3', 'tm-2', 'sub-1'),

('job-4', 'JOB-004', 'Ana Costa', '321 Elm St', 'Brookline', 'interior', 'lead',
 '2024-12-18', NULL, NULL,
 6500, 975, 2925, 3900, 2600, 40,
 1950, false, 6500,
 5, 325, 3, 195, 3900,
 true, true, 'OK',
 'tm-1', NULL, NULL);

-- Sample Marketing Spend
INSERT INTO "MarketingSpend" ("source", "monthYear", "amount", "leads") VALUES
('Google Ads', '2024-12', 1500, 25),
('Facebook Ads', '2024-12', 800, 15),
('Referrals', '2024-12', 0, 10),
('Google Ads', '2024-11', 1400, 22),
('Facebook Ads', '2024-11', 750, 12);

-- Sample Knowledge Articles
INSERT INTO "KnowledgeArticle" ("title", "category", "icon", "content") VALUES
('Processo de Pintura Interior', 'Processos', 'Paintbrush', '# Processo de Pintura Interior

## Preparação
1. Proteger móveis e pisos
2. Limpar paredes
3. Reparar imperfeições

## Aplicação
1. Aplicar primer
2. Primeira demão
3. Segunda demão'),

('Checklist de Segurança', 'Segurança', 'Shield', '# Checklist de Segurança

- [ ] Equipamentos de proteção
- [ ] Ventilação adequada
- [ ] Escadas seguras
- [ ] Produtos armazenados corretamente');

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- ============================================

-- Enable RLS on all tables (uncomment to enable)
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Subcontractor" ENABLE ROW LEVEL SECURITY;

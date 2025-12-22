-- ============================================
-- MULTI-TENANT SaaS + GoHighLevel Integration
-- Migration: 001_multi_tenant_ghl.sql
-- ============================================

-- ============================================
-- NEW ENUMS FOR MULTI-TENANT & GHL
-- ============================================

CREATE TYPE "TenantPlan" AS ENUM ('starter', 'professional', 'enterprise');
CREATE TYPE "TenantUserRole" AS ENUM ('owner', 'admin', 'manager', 'viewer');
CREATE TYPE "GhlEventType" AS ENUM (
    'contact_created',
    'contact_updated',
    'opportunity_created',
    'opportunity_updated',
    'opportunity_status_changed',
    'opportunity_stage_changed',
    'note_created',
    'task_created',
    'appointment_created',
    'appointment_updated'
);
CREATE TYPE "GhlLeadStatus" AS ENUM (
    'new',
    'contacted',
    'qualified',
    'estimate_scheduled',
    'estimate_sent',
    'follow_up',
    'won',
    'lost'
);
CREATE TYPE "CampaignPlatform" AS ENUM ('meta', 'google', 'tiktok', 'bing', 'other');
CREATE TYPE "TargetPeriodType" AS ENUM ('annual', 'quarterly', 'monthly');

-- ============================================
-- TENANTS (Empresas/Contas)
-- ============================================

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "plan" "TenantPlan" NOT NULL DEFAULT 'starter',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    -- Configurações gerais
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fiscalYearStart" INTEGER NOT NULL DEFAULT 1, -- Mês (1-12)

    -- Limites do plano
    "maxUsers" INTEGER NOT NULL DEFAULT 3,
    "maxWorkspaces" INTEGER NOT NULL DEFAULT 1,
    "maxGhlLocations" INTEGER NOT NULL DEFAULT 1,

    -- Billing (Stripe)
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "billingEmail" TEXT,
    "trialEndsAt" TIMESTAMP(3),

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX "Tenant_isActive_idx" ON "Tenant"("isActive");

-- ============================================
-- TENANT USERS (Usuários por Tenant)
-- ============================================

CREATE TABLE "TenantUser" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TenantUserRole" NOT NULL DEFAULT 'viewer',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantUser_tenantId_userId_key" ON "TenantUser"("tenantId", "userId");
CREATE INDEX "TenantUser_tenantId_idx" ON "TenantUser"("tenantId");
CREATE INDEX "TenantUser_userId_idx" ON "TenantUser"("userId");

-- ============================================
-- WORKSPACES (Filiais/Unidades - Opcional)
-- ============================================

CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Workspace_tenantId_idx" ON "Workspace"("tenantId");

-- ============================================
-- GHL CONNECTIONS (Conexões com GoHighLevel)
-- ============================================

CREATE TABLE "GhlConnection" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT,

    -- GHL API Credentials
    "locationId" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),

    -- Webhook config
    "webhookSecret" TEXT,
    "webhookUrl" TEXT,
    "webhookEnabled" BOOLEAN NOT NULL DEFAULT true,

    -- Sync settings
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,

    -- Pipeline mapping
    "pipelineId" TEXT,
    "pipelineName" TEXT,
    "stageMapping" JSONB NOT NULL DEFAULT '{}',
    -- Ex: {"won_stage_id": "abc123", "lost_stage_id": "xyz789", "estimate_stage_id": "..."}

    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GhlConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GhlConnection_locationId_key" ON "GhlConnection"("locationId");
CREATE INDEX "GhlConnection_tenantId_idx" ON "GhlConnection"("tenantId");

-- ============================================
-- GHL EVENTS RAW (Dados brutos do webhook)
-- ============================================

CREATE TABLE "GhlEventRaw" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "payload" JSONB NOT NULL,

    -- Processing status
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GhlEventRaw_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GhlEventRaw_tenantId_idx" ON "GhlEventRaw"("tenantId");
CREATE INDEX "GhlEventRaw_connectionId_idx" ON "GhlEventRaw"("connectionId");
CREATE INDEX "GhlEventRaw_eventType_idx" ON "GhlEventRaw"("eventType");
CREATE INDEX "GhlEventRaw_processedAt_idx" ON "GhlEventRaw"("processedAt");
CREATE INDEX "GhlEventRaw_receivedAt_idx" ON "GhlEventRaw"("receivedAt");

-- ============================================
-- GHL LEADS (Leads normalizados do GHL)
-- ============================================

CREATE TABLE "GhlLead" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "workspaceId" TEXT,

    -- GHL IDs
    "ghlContactId" TEXT NOT NULL,
    "ghlOpportunityId" TEXT,

    -- Contact Info
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,

    -- Lead/Opportunity data
    "source" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB DEFAULT '{}',

    -- Pipeline info
    "pipelineId" TEXT,
    "pipelineName" TEXT,
    "stageId" TEXT,
    "stageName" TEXT,

    -- Status & Value
    "status" "GhlLeadStatus" NOT NULL DEFAULT 'new',
    "monetaryValue" DOUBLE PRECISION DEFAULT 0,
    "estimatedValue" DOUBLE PRECISION DEFAULT 0,
    "actualValue" DOUBLE PRECISION DEFAULT 0,

    -- Tracking
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "estimateSentAt" TIMESTAMP(3),

    -- Assignment
    "assignedUserId" TEXT,
    "assignedUserName" TEXT,

    -- GHL Timestamps
    "ghlCreatedAt" TIMESTAMP(3),
    "ghlUpdatedAt" TIMESTAMP(3),

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GhlLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GhlLead_tenantId_ghlContactId_key" ON "GhlLead"("tenantId", "ghlContactId");
CREATE INDEX "GhlLead_tenantId_idx" ON "GhlLead"("tenantId");
CREATE INDEX "GhlLead_connectionId_idx" ON "GhlLead"("connectionId");
CREATE INDEX "GhlLead_status_idx" ON "GhlLead"("status");
CREATE INDEX "GhlLead_source_idx" ON "GhlLead"("source");
CREATE INDEX "GhlLead_createdAt_idx" ON "GhlLead"("createdAt");
CREATE INDEX "GhlLead_wonAt_idx" ON "GhlLead"("wonAt");

-- ============================================
-- TARGETS (Metas Anuais/Mensais)
-- ============================================

CREATE TABLE "Target" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT,

    "year" INTEGER NOT NULL,
    "periodType" "TargetPeriodType" NOT NULL DEFAULT 'annual',
    "period" INTEGER, -- Mês (1-12) ou Quarter (1-4), NULL se anual

    -- Revenue targets
    "revenueTarget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jobsTarget" INTEGER NOT NULL DEFAULT 0,

    -- Lead targets
    "leadsTarget" INTEGER NOT NULL DEFAULT 0,
    "estimatesTarget" INTEGER NOT NULL DEFAULT 0,

    -- Conversion targets
    "closeRateTarget" DOUBLE PRECISION NOT NULL DEFAULT 30, -- %
    "averageTicketTarget" DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Marketing budget
    "marketingBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cplTarget" DOUBLE PRECISION NOT NULL DEFAULT 0, -- Cost per lead
    "cacTarget" DOUBLE PRECISION NOT NULL DEFAULT 0, -- Customer acquisition cost

    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Target_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Target_tenantId_year_periodType_period_key" ON "Target"("tenantId", "year", "periodType", "period");
CREATE INDEX "Target_tenantId_idx" ON "Target"("tenantId");
CREATE INDEX "Target_year_idx" ON "Target"("year");

-- ============================================
-- SEASONALITY (Curva Sazonal por Mês)
-- ============================================

CREATE TABLE "Seasonality" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,

    -- Percentual de cada mês (soma = 100%)
    "january" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "february" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "march" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "april" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "may" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "june" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "july" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "august" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "september" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "october" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "november" DOUBLE PRECISION NOT NULL DEFAULT 8.33,
    "december" DOUBLE PRECISION NOT NULL DEFAULT 8.37,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Seasonality_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Seasonality_tenantId_year_key" ON "Seasonality"("tenantId", "year");
CREATE INDEX "Seasonality_tenantId_idx" ON "Seasonality"("tenantId");

-- ============================================
-- CAMPAIGN SPEND (Gastos com Marketing)
-- ============================================

CREATE TABLE "CampaignSpend" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT,

    "platform" "CampaignPlatform" NOT NULL,
    "campaignName" TEXT NOT NULL,
    "campaignId" TEXT, -- ID na plataforma (opcional)

    "date" DATE NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER DEFAULT 0,
    "clicks" INTEGER DEFAULT 0,
    "leads" INTEGER DEFAULT 0,

    -- Calculados
    "cpc" DOUBLE PRECISION, -- Cost per click
    "cpl" DOUBLE PRECISION, -- Cost per lead
    "ctr" DOUBLE PRECISION, -- Click through rate

    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignSpend_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CampaignSpend_tenantId_idx" ON "CampaignSpend"("tenantId");
CREATE INDEX "CampaignSpend_platform_idx" ON "CampaignSpend"("platform");
CREATE INDEX "CampaignSpend_date_idx" ON "CampaignSpend"("date");
CREATE INDEX "CampaignSpend_tenantId_date_idx" ON "CampaignSpend"("tenantId", "date");

-- ============================================
-- DAILY KPIs (Agregação diária p/ performance)
-- ============================================

CREATE TABLE "DailyKpi" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "date" DATE NOT NULL,

    -- Lead Metrics
    "leadsNew" INTEGER NOT NULL DEFAULT 0,
    "leadsContacted" INTEGER NOT NULL DEFAULT 0,
    "leadsQualified" INTEGER NOT NULL DEFAULT 0,

    -- Estimate Metrics
    "estimatesScheduled" INTEGER NOT NULL DEFAULT 0,
    "estimatesSent" INTEGER NOT NULL DEFAULT 0,
    "estimatesAccepted" INTEGER NOT NULL DEFAULT 0,
    "estimatesDeclined" INTEGER NOT NULL DEFAULT 0,

    -- Sales Metrics
    "jobsWon" INTEGER NOT NULL DEFAULT 0,
    "jobsLost" INTEGER NOT NULL DEFAULT 0,
    "revenueWon" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueLost" DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Marketing Metrics
    "marketingSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpl" DOUBLE PRECISION, -- Cost per lead
    "cac" DOUBLE PRECISION, -- Customer acquisition cost

    -- Calculated Rates
    "closeRate" DOUBLE PRECISION, -- (won / (won + lost)) * 100
    "conversionRate" DOUBLE PRECISION, -- (won / leads) * 100
    "averageTicket" DOUBLE PRECISION, -- revenue / jobs

    -- Source breakdown (JSON)
    "leadsBySource" JSONB DEFAULT '{}',
    "revenueBySource" JSONB DEFAULT '{}',

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyKpi_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyKpi_tenantId_date_key" ON "DailyKpi"("tenantId", "date");
CREATE INDEX "DailyKpi_tenantId_idx" ON "DailyKpi"("tenantId");
CREATE INDEX "DailyKpi_date_idx" ON "DailyKpi"("date");

-- ============================================
-- ADD tenant_id TO EXISTING TABLES
-- ============================================

-- Add tenantId to existing tables (nullable first for migration)
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Subcontractor" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "BusinessSettings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "RoomPrice" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "ExteriorPrice" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Addon" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "VTO" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Rock" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Todo" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Seat" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "ScorecardMetric" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "CompanyEstimateSettings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "AIConversation" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Add indexes for tenantId on existing tables
CREATE INDEX IF NOT EXISTS "Lead_tenantId_idx" ON "Lead"("tenantId");
CREATE INDEX IF NOT EXISTS "Estimate_tenantId_idx" ON "Estimate"("tenantId");
CREATE INDEX IF NOT EXISTS "Job_tenantId_idx" ON "Job"("tenantId");
CREATE INDEX IF NOT EXISTS "TeamMember_tenantId_idx" ON "TeamMember"("tenantId");
CREATE INDEX IF NOT EXISTS "Subcontractor_tenantId_idx" ON "Subcontractor"("tenantId");
CREATE INDEX IF NOT EXISTS "BusinessSettings_tenantId_idx" ON "BusinessSettings"("tenantId");

-- ============================================
-- FOREIGN KEYS FOR NEW TABLES
-- ============================================

ALTER TABLE "TenantUser" ADD CONSTRAINT "TenantUser_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantUser" ADD CONSTRAINT "TenantUser_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GhlConnection" ADD CONSTRAINT "GhlConnection_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GhlConnection" ADD CONSTRAINT "GhlConnection_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GhlEventRaw" ADD CONSTRAINT "GhlEventRaw_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GhlEventRaw" ADD CONSTRAINT "GhlEventRaw_connectionId_fkey"
    FOREIGN KEY ("connectionId") REFERENCES "GhlConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GhlLead" ADD CONSTRAINT "GhlLead_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GhlLead" ADD CONSTRAINT "GhlLead_connectionId_fkey"
    FOREIGN KEY ("connectionId") REFERENCES "GhlConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GhlLead" ADD CONSTRAINT "GhlLead_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Target" ADD CONSTRAINT "Target_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Target" ADD CONSTRAINT "Target_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Seasonality" ADD CONSTRAINT "Seasonality_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CampaignSpend" ADD CONSTRAINT "CampaignSpend_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CampaignSpend" ADD CONSTRAINT "CampaignSpend_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DailyKpi" ADD CONSTRAINT "DailyKpi_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyKpi" ADD CONSTRAINT "DailyKpi_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================
-- TRIGGERS FOR NEW TABLES
-- ============================================

CREATE TRIGGER set_timestamp_tenant BEFORE UPDATE ON "Tenant" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_tenant_user BEFORE UPDATE ON "TenantUser" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_workspace BEFORE UPDATE ON "Workspace" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_ghl_connection BEFORE UPDATE ON "GhlConnection" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_ghl_lead BEFORE UPDATE ON "GhlLead" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_target BEFORE UPDATE ON "Target" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_seasonality BEFORE UPDATE ON "Seasonality" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_campaign_spend BEFORE UPDATE ON "CampaignSpend" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_daily_kpi BEFORE UPDATE ON "DailyKpi" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GhlConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GhlEventRaw" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GhlLead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Target" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Seasonality" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampaignSpend" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DailyKpi" ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be created based on your auth strategy
-- Example policy (adjust based on your auth implementation):
-- CREATE POLICY "Users can only see their tenant's data" ON "GhlLead"
--     FOR ALL
--     USING (
--         "tenantId" IN (
--             SELECT "tenantId" FROM "TenantUser"
--             WHERE "userId" = auth.uid() AND "isActive" = true
--         )
--     );

-- ============================================
-- HELPER FUNCTIONS FOR KPI CALCULATIONS
-- ============================================

-- Function to calculate daily KPIs for a tenant
CREATE OR REPLACE FUNCTION calculate_daily_kpis(
    p_tenant_id TEXT,
    p_date DATE
) RETURNS void AS $$
DECLARE
    v_leads_new INTEGER;
    v_jobs_won INTEGER;
    v_jobs_lost INTEGER;
    v_revenue_won DOUBLE PRECISION;
    v_revenue_lost DOUBLE PRECISION;
    v_marketing_spend DOUBLE PRECISION;
    v_close_rate DOUBLE PRECISION;
    v_cpl DOUBLE PRECISION;
    v_cac DOUBLE PRECISION;
    v_avg_ticket DOUBLE PRECISION;
BEGIN
    -- Count new leads
    SELECT COUNT(*) INTO v_leads_new
    FROM "GhlLead"
    WHERE "tenantId" = p_tenant_id
    AND DATE("createdAt") = p_date;

    -- Count won jobs
    SELECT COUNT(*), COALESCE(SUM("actualValue"), 0)
    INTO v_jobs_won, v_revenue_won
    FROM "GhlLead"
    WHERE "tenantId" = p_tenant_id
    AND DATE("wonAt") = p_date
    AND "status" = 'won';

    -- Count lost jobs
    SELECT COUNT(*), COALESCE(SUM("estimatedValue"), 0)
    INTO v_jobs_lost, v_revenue_lost
    FROM "GhlLead"
    WHERE "tenantId" = p_tenant_id
    AND DATE("lostAt") = p_date
    AND "status" = 'lost';

    -- Get marketing spend
    SELECT COALESCE(SUM("spend"), 0) INTO v_marketing_spend
    FROM "CampaignSpend"
    WHERE "tenantId" = p_tenant_id
    AND "date" = p_date;

    -- Calculate rates
    IF (v_jobs_won + v_jobs_lost) > 0 THEN
        v_close_rate := (v_jobs_won::DOUBLE PRECISION / (v_jobs_won + v_jobs_lost)::DOUBLE PRECISION) * 100;
    ELSE
        v_close_rate := NULL;
    END IF;

    IF v_leads_new > 0 AND v_marketing_spend > 0 THEN
        v_cpl := v_marketing_spend / v_leads_new;
    ELSE
        v_cpl := NULL;
    END IF;

    IF v_jobs_won > 0 AND v_marketing_spend > 0 THEN
        v_cac := v_marketing_spend / v_jobs_won;
        v_avg_ticket := v_revenue_won / v_jobs_won;
    ELSE
        v_cac := NULL;
        v_avg_ticket := NULL;
    END IF;

    -- Upsert daily KPI
    INSERT INTO "DailyKpi" (
        "tenantId", "date", "leadsNew", "jobsWon", "jobsLost",
        "revenueWon", "revenueLost", "marketingSpend",
        "closeRate", "cpl", "cac", "averageTicket"
    ) VALUES (
        p_tenant_id, p_date, v_leads_new, v_jobs_won, v_jobs_lost,
        v_revenue_won, v_revenue_lost, v_marketing_spend,
        v_close_rate, v_cpl, v_cac, v_avg_ticket
    )
    ON CONFLICT ("tenantId", "date")
    DO UPDATE SET
        "leadsNew" = EXCLUDED."leadsNew",
        "jobsWon" = EXCLUDED."jobsWon",
        "jobsLost" = EXCLUDED."jobsLost",
        "revenueWon" = EXCLUDED."revenueWon",
        "revenueLost" = EXCLUDED."revenueLost",
        "marketingSpend" = EXCLUDED."marketingSpend",
        "closeRate" = EXCLUDED."closeRate",
        "cpl" = EXCLUDED."cpl",
        "cac" = EXCLUDED."cac",
        "averageTicket" = EXCLUDED."averageTicket",
        "updatedAt" = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly target with seasonality
CREATE OR REPLACE FUNCTION get_monthly_target(
    p_tenant_id TEXT,
    p_year INTEGER,
    p_month INTEGER
) RETURNS TABLE (
    revenue_target DOUBLE PRECISION,
    leads_target INTEGER,
    jobs_target INTEGER
) AS $$
DECLARE
    v_annual_target RECORD;
    v_seasonality RECORD;
    v_month_pct DOUBLE PRECISION;
BEGIN
    -- Get annual target
    SELECT * INTO v_annual_target
    FROM "Target"
    WHERE "tenantId" = p_tenant_id
    AND "year" = p_year
    AND "periodType" = 'annual'
    LIMIT 1;

    -- Get seasonality
    SELECT * INTO v_seasonality
    FROM "Seasonality"
    WHERE "tenantId" = p_tenant_id
    AND "year" = p_year
    LIMIT 1;

    -- Get month percentage
    v_month_pct := CASE p_month
        WHEN 1 THEN COALESCE(v_seasonality."january", 8.33)
        WHEN 2 THEN COALESCE(v_seasonality."february", 8.33)
        WHEN 3 THEN COALESCE(v_seasonality."march", 8.33)
        WHEN 4 THEN COALESCE(v_seasonality."april", 8.33)
        WHEN 5 THEN COALESCE(v_seasonality."may", 8.33)
        WHEN 6 THEN COALESCE(v_seasonality."june", 8.33)
        WHEN 7 THEN COALESCE(v_seasonality."july", 8.33)
        WHEN 8 THEN COALESCE(v_seasonality."august", 8.33)
        WHEN 9 THEN COALESCE(v_seasonality."september", 8.33)
        WHEN 10 THEN COALESCE(v_seasonality."october", 8.33)
        WHEN 11 THEN COALESCE(v_seasonality."november", 8.33)
        WHEN 12 THEN COALESCE(v_seasonality."december", 8.37)
        ELSE 8.33
    END / 100;

    RETURN QUERY SELECT
        COALESCE(v_annual_target."revenueTarget", 0) * v_month_pct,
        (COALESCE(v_annual_target."leadsTarget", 0) * v_month_pct)::INTEGER,
        (COALESCE(v_annual_target."jobsTarget", 0) * v_month_pct)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily target (monthly / business days)
CREATE OR REPLACE FUNCTION get_daily_target(
    p_tenant_id TEXT,
    p_date DATE
) RETURNS TABLE (
    revenue_target DOUBLE PRECISION,
    leads_target DOUBLE PRECISION,
    jobs_target DOUBLE PRECISION
) AS $$
DECLARE
    v_year INTEGER;
    v_month INTEGER;
    v_monthly RECORD;
    v_business_days INTEGER;
BEGIN
    v_year := EXTRACT(YEAR FROM p_date)::INTEGER;
    v_month := EXTRACT(MONTH FROM p_date)::INTEGER;

    -- Get monthly targets
    SELECT * INTO v_monthly
    FROM get_monthly_target(p_tenant_id, v_year, v_month);

    -- Count business days in month (simplified: weekdays only)
    SELECT COUNT(*) INTO v_business_days
    FROM generate_series(
        date_trunc('month', p_date)::date,
        (date_trunc('month', p_date) + interval '1 month - 1 day')::date,
        '1 day'
    ) AS d
    WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);

    IF v_business_days = 0 THEN
        v_business_days := 22; -- default
    END IF;

    RETURN QUERY SELECT
        v_monthly.revenue_target / v_business_days,
        v_monthly.leads_target::DOUBLE PRECISION / v_business_days,
        v_monthly.jobs_target::DOUBLE PRECISION / v_business_days;
END;
$$ LANGUAGE plpgsql;

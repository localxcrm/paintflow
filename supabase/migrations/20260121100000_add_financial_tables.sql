-- Add financial tracking tables for subcontractor cost management
-- Migration created: 2026-01-21

-- ============================================
-- SECTION 1: ENUMS
-- ============================================

-- Payment type enum for SubcontractorPayment
CREATE TYPE payment_type AS ENUM ('deposit', 'final', 'extra');

-- Payment status enum for tracking payment state
CREATE TYPE payment_status AS ENUM ('pending', 'paid');

-- ============================================
-- SECTION 2: TABLES
-- ============================================

-- SubcontractorEmployee: Workers employed by subcontractors
-- Note: Creating new table (not altering SubcontractorPainter) for proper RLS with organizationId
CREATE TABLE "SubcontractorEmployee" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "subcontractorId" UUID NOT NULL REFERENCES "Subcontractor"("id") ON DELETE CASCADE,
    "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE "SubcontractorEmployee" IS 'Workers employed by subcontractors with hourly rates for time tracking';

-- TimeEntry: Daily time entries per employee per job
CREATE TABLE "TimeEntry" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "employeeId" UUID NOT NULL REFERENCES "SubcontractorEmployee"("id") ON DELETE CASCADE,
    "jobId" UUID NOT NULL REFERENCES "Job"("id") ON DELETE RESTRICT,
    "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "workDate" DATE NOT NULL,
    "hoursWorked" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "timeentry_unique_employee_job_date" UNIQUE ("employeeId", "jobId", "workDate")
);

COMMENT ON TABLE "TimeEntry" IS 'Daily time entries tracking hours worked per employee per job';

-- JobMaterialCost: Total material cost per job per subcontractor
CREATE TABLE "JobMaterialCost" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "jobId" UUID NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
    "subcontractorId" UUID NOT NULL REFERENCES "Subcontractor"("id") ON DELETE CASCADE,
    "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "totalCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "materialcost_unique_job_sub" UNIQUE ("jobId", "subcontractorId")
);

COMMENT ON TABLE "JobMaterialCost" IS 'Total material cost per job per subcontractor (single amount, not itemized)';

-- SubcontractorPayout: Payout header created when job marked complete
CREATE TABLE "SubcontractorPayout" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "jobId" UUID NOT NULL REFERENCES "Job"("id") ON DELETE RESTRICT,
    "subcontractorId" UUID NOT NULL REFERENCES "Subcontractor"("id") ON DELETE RESTRICT,
    "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "payoutPct" DECIMAL(5,2) NOT NULL,
    "jobValue" DECIMAL(10,2) NOT NULL,
    "calculatedPayout" DECIMAL(10,2) NOT NULL,
    "totalLaborCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalMaterialCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deductionNotes" TEXT,
    "finalPayout" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "payout_unique_job" UNIQUE ("jobId")
);

COMMENT ON TABLE "SubcontractorPayout" IS 'Payout header created when job is marked complete, capturing snapshot of job value and calculations';

-- SubcontractorPayment: Individual payments (deposit, final, extras) linked to payout
CREATE TABLE "SubcontractorPayment" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "payoutId" UUID NOT NULL REFERENCES "SubcontractorPayout"("id") ON DELETE CASCADE,
    "organizationId" UUID NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "paymentType" payment_type NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" payment_status NOT NULL DEFAULT 'pending',
    "paidDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE "SubcontractorPayment" IS 'Individual payments (deposit, final, extras) linked to a payout record';

-- ============================================
-- SECTION 3: ALTER EXISTING TABLES
-- ============================================

-- Add defaultDepositPct to Subcontractor for subcontractor-specific deposit percentage
ALTER TABLE "Subcontractor" ADD COLUMN IF NOT EXISTS "defaultDepositPct" DECIMAL(5,2) NOT NULL DEFAULT 50.0;

COMMENT ON COLUMN "Subcontractor"."defaultDepositPct" IS 'Default deposit percentage for this subcontractor (can override org default)';

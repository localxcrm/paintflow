-- Financial Module Tables for Subcontractor Portal
-- All IDs use TEXT type to match existing schema

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS "SubcontractorPayment" CASCADE;
DROP TABLE IF EXISTS "SubcontractorPayout" CASCADE;
DROP TABLE IF EXISTS "JobMaterialCost" CASCADE;
DROP TABLE IF EXISTS "TimeEntry" CASCADE;
DROP TABLE IF EXISTS "SubcontractorEmployee" CASCADE;

-- SubcontractorEmployee table - employees managed by subcontractors
CREATE TABLE "SubcontractorEmployee" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "subcontractorId" TEXT NOT NULL REFERENCES "Subcontractor"("id") ON DELETE CASCADE,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "hourlyRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TimeEntry table - daily time tracking
CREATE TABLE "TimeEntry" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "employeeId" TEXT NOT NULL REFERENCES "SubcontractorEmployee"("id") ON DELETE CASCADE,
  "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "workDate" DATE NOT NULL,
  "hoursWorked" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- JobMaterialCost table - material costs per job
CREATE TABLE "JobMaterialCost" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
  "subcontractorId" TEXT NOT NULL REFERENCES "Subcontractor"("id") ON DELETE CASCADE,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "totalCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SubcontractorPayout table - payout records for completed jobs
CREATE TABLE "SubcontractorPayout" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
  "subcontractorId" TEXT NOT NULL REFERENCES "Subcontractor"("id") ON DELETE CASCADE,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "payoutPct" DECIMAL(5,2) NOT NULL,
  "jobValue" DECIMAL(12,2) NOT NULL,
  "calculatedPayout" DECIMAL(12,2) NOT NULL,
  "totalLaborCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalMaterialCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "deductionNotes" TEXT,
  "finalPayout" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SubcontractorPayment table - payment records
CREATE TABLE "SubcontractorPayment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "payoutId" TEXT NOT NULL REFERENCES "SubcontractorPayout"("id") ON DELETE CASCADE,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "amount" DECIMAL(12,2) NOT NULL,
  "paymentMethod" VARCHAR(50),
  "paymentDate" DATE NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX "idx_subcontractor_employee_sub" ON "SubcontractorEmployee"("subcontractorId");
CREATE INDEX "idx_subcontractor_employee_org" ON "SubcontractorEmployee"("organizationId");
CREATE INDEX "idx_time_entry_employee" ON "TimeEntry"("employeeId");
CREATE INDEX "idx_time_entry_job" ON "TimeEntry"("jobId");
CREATE INDEX "idx_time_entry_org" ON "TimeEntry"("organizationId");
CREATE INDEX "idx_time_entry_date" ON "TimeEntry"("workDate");
CREATE INDEX "idx_job_material_cost_job" ON "JobMaterialCost"("jobId");
CREATE INDEX "idx_job_material_cost_sub" ON "JobMaterialCost"("subcontractorId");
CREATE INDEX "idx_subcontractor_payout_job" ON "SubcontractorPayout"("jobId");
CREATE INDEX "idx_subcontractor_payout_sub" ON "SubcontractorPayout"("subcontractorId");
CREATE INDEX "idx_subcontractor_payment_payout" ON "SubcontractorPayment"("payoutId");

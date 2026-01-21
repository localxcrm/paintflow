-- Add performance indexes for financial tables
-- Migration created: 2026-01-21
-- These indexes optimize RLS policy evaluation and common query patterns

-- ============================================
-- SubcontractorEmployee indexes
-- ============================================

-- Composite index for RLS + subcontractor lookup
CREATE INDEX IF NOT EXISTS "idx_employee_org_sub"
ON "SubcontractorEmployee"("organizationId", "subcontractorId");

-- Partial index for active employees only
CREATE INDEX IF NOT EXISTS "idx_employee_active"
ON "SubcontractorEmployee"("subcontractorId", "isActive") WHERE "isActive" = true;

-- ============================================
-- TimeEntry indexes
-- ============================================

-- Composite index for RLS + employee lookup
CREATE INDEX IF NOT EXISTS "idx_timeentry_org_employee"
ON "TimeEntry"("organizationId", "employeeId");

-- Composite index for RLS + job lookup (for job-centric time queries)
CREATE INDEX IF NOT EXISTS "idx_timeentry_org_job"
ON "TimeEntry"("organizationId", "jobId");

-- Index for date range queries (recent time entries)
CREATE INDEX IF NOT EXISTS "idx_timeentry_workdate"
ON "TimeEntry"("workDate" DESC);

-- ============================================
-- JobMaterialCost indexes
-- ============================================

-- Composite index for RLS + job lookup
CREATE INDEX IF NOT EXISTS "idx_materialcost_org_job"
ON "JobMaterialCost"("organizationId", "jobId");

-- Composite index for RLS + subcontractor lookup
CREATE INDEX IF NOT EXISTS "idx_materialcost_org_sub"
ON "JobMaterialCost"("organizationId", "subcontractorId");

-- ============================================
-- SubcontractorPayout indexes
-- ============================================

-- Composite index for RLS + subcontractor lookup (payout history)
CREATE INDEX IF NOT EXISTS "idx_payout_org_sub"
ON "SubcontractorPayout"("organizationId", "subcontractorId");

-- Composite index for RLS + job lookup
CREATE INDEX IF NOT EXISTS "idx_payout_org_job"
ON "SubcontractorPayout"("organizationId", "jobId");

-- ============================================
-- SubcontractorPayment indexes
-- ============================================

-- Composite index for RLS + payout lookup
CREATE INDEX IF NOT EXISTS "idx_payment_org_payout"
ON "SubcontractorPayment"("organizationId", "payoutId");

-- Partial index for pending payments only (common dashboard query)
CREATE INDEX IF NOT EXISTS "idx_payment_pending"
ON "SubcontractorPayment"("status") WHERE "status" = 'pending';

-- Comment: These indexes improve query performance for common operations:
-- - Employee listing by subcontractor with RLS
-- - Time entry lookups by employee, job, or date range
-- - Material cost queries by job or subcontractor
-- - Payout history for subcontractors
-- - Payment tracking with focus on pending payments

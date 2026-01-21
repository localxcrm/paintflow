-- Add Row Level Security policies for financial tables
-- Migration created: 2026-01-21

-- ============================================
-- SECTION 1: ENABLE RLS ON ALL FINANCIAL TABLES
-- ============================================

ALTER TABLE "SubcontractorEmployee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JobMaterialCost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubcontractorPayout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubcontractorPayment" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECTION 2: CREATE RLS POLICIES
-- ============================================
-- Using get_current_org_id() function which reads from current_setting('app.current_organization_id')
-- This matches the existing pattern used for VTO, BusinessSettings, Lead, Job, etc.

-- SubcontractorEmployee: Access only within organization
CREATE POLICY "employee_org_access" ON "SubcontractorEmployee"
FOR ALL USING ("organizationId" = get_current_org_id());

-- TimeEntry: Access only within organization
CREATE POLICY "timeentry_org_access" ON "TimeEntry"
FOR ALL USING ("organizationId" = get_current_org_id());

-- JobMaterialCost: Access only within organization
CREATE POLICY "materialcost_org_access" ON "JobMaterialCost"
FOR ALL USING ("organizationId" = get_current_org_id());

-- SubcontractorPayout: Access only within organization
CREATE POLICY "payout_org_access" ON "SubcontractorPayout"
FOR ALL USING ("organizationId" = get_current_org_id());

-- SubcontractorPayment: Access only within organization
CREATE POLICY "payment_org_access" ON "SubcontractorPayment"
FOR ALL USING ("organizationId" = get_current_org_id());

-- Comment: These policies ensure multi-tenant isolation by filtering all queries
-- through the organizationId column, matching the pattern used by existing tables
-- like VTO, BusinessSettings, Lead, Estimate, Job, etc.

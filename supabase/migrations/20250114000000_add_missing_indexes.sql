-- Add missing indexes for improved query performance
-- Migration created: 2025-01-14

-- EstimateLineItem indexes for FK lookups
CREATE INDEX IF NOT EXISTS "idx_estimatelineitem_estimateid" ON "EstimateLineItem"("estimateId");

-- Estimate indexes for lead relationships
CREATE INDEX IF NOT EXISTS "idx_estimate_leadid" ON "Estimate"("leadId");
CREATE INDEX IF NOT EXISTS "idx_estimate_org_status" ON "Estimate"("organizationId", "status");

-- Job composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_job_org_status_date" ON "Job"("organizationId", "status", "jobDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_job_leadid" ON "Job"("leadId");
CREATE INDEX IF NOT EXISTS "idx_job_estimateid" ON "Job"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_job_salesrepid" ON "Job"("salesRepId");
CREATE INDEX IF NOT EXISTS "idx_job_projectmanagerid" ON "Job"("projectManagerId");

-- Lead composite indexes
CREATE INDEX IF NOT EXISTS "idx_lead_org_status" ON "Lead"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "idx_lead_assignedtoid" ON "Lead"("assignedToId");

-- Pricing table indexes for organization filtering
CREATE INDEX IF NOT EXISTS "idx_roomprice_org" ON "RoomPrice"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_exteriorprice_org" ON "ExteriorPrice"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_addon_org" ON "Addon"("organizationId");

-- Rock status filtering
CREATE INDEX IF NOT EXISTS "idx_rock_org_status" ON "Rock"("organizationId", "status");

-- ScorecardEntry metric lookups
CREATE INDEX IF NOT EXISTS "idx_scorecardentry_metricid" ON "ScorecardEntry"("metricId");

-- Seat reporting hierarchy
CREATE INDEX IF NOT EXISTS "idx_seat_reportstoid" ON "Seat"("reportsToId");

-- Marketing spend source analysis
CREATE INDEX IF NOT EXISTS "idx_marketingspend_org_source" ON "MarketingSpend"("organizationId", "source");

-- Weekly sales date range queries
CREATE INDEX IF NOT EXISTS "idx_weeklysales_org_week" ON "WeeklySales"("organizationId", "weekStart");

-- Todo rock relationship
CREATE INDEX IF NOT EXISTS "idx_todo_rockid" ON "Todo"("rockId");

-- Comment: These indexes improve query performance for common operations:
-- - Job filtering by org/status/date (dashboard, reports)
-- - Lead pipeline queries
-- - Estimate line item loading
-- - Sales rep/PM performance lookups
-- - EOS/Traction scorecard and rock queries

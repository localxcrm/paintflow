-- ===========================================
-- Add percentage columns to TeamMember and Subcontractor
-- Run this in Supabase SQL Editor
-- ===========================================

-- Add defaultCommissionPct to TeamMember
ALTER TABLE "TeamMember"
ADD COLUMN IF NOT EXISTS "defaultCommissionPct" NUMERIC DEFAULT 5;

-- Add defaultPayoutPct to Subcontractor
ALTER TABLE "Subcontractor"
ADD COLUMN IF NOT EXISTS "defaultPayoutPct" NUMERIC DEFAULT 60;

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'TeamMember';

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'Subcontractor';

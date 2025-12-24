-- Add settings column to Organization table for feature flags
ALTER TABLE "Organization" 
ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}';

-- Update existing organizations to have default settings
UPDATE "Organization"
SET "settings" = '{"aiAssistant": true, "customDomain": false, "advancedEstimating": true}'
WHERE "settings" IS NULL OR "settings" = '{}';

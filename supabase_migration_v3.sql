-- PaintPro Database Migration v3
-- Adds: WeeklySales table, Subcontractor colors, Job location fields
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD COLOR TO SUBCONTRACTOR
-- ============================================

ALTER TABLE "Subcontractor"
ADD COLUMN IF NOT EXISTS "color" VARCHAR(20) DEFAULT 'bg-blue-500';

-- Update existing subcontractors with different colors
UPDATE "Subcontractor" SET "color" = 'bg-blue-500' WHERE "id" = 'sub-1';
UPDATE "Subcontractor" SET "color" = 'bg-green-500' WHERE "id" = 'sub-2';
UPDATE "Subcontractor" SET "color" = 'bg-purple-500' WHERE "id" = 'sub-3';

-- ============================================
-- 2. ADD LOCATION FIELDS TO JOB
-- ============================================

ALTER TABLE "Job"
ADD COLUMN IF NOT EXISTS "state" VARCHAR(2);

ALTER TABLE "Job"
ADD COLUMN IF NOT EXISTS "zipCode" VARCHAR(10);

ALTER TABLE "Job"
ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10, 8);

ALTER TABLE "Job"
ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(11, 8);

-- Update existing jobs with sample coordinates (Connecticut area)
UPDATE "Job" SET "state" = 'MA', "zipCode" = '02101', "latitude" = 42.3601, "longitude" = -71.0589 WHERE "city" = 'Boston';
UPDATE "Job" SET "state" = 'MA', "zipCode" = '02139', "latitude" = 42.3736, "longitude" = -71.1097 WHERE "city" = 'Cambridge';
UPDATE "Job" SET "state" = 'MA', "zipCode" = '02143', "latitude" = 42.3876, "longitude" = -71.0995 WHERE "city" = 'Somerville';
UPDATE "Job" SET "state" = 'MA', "zipCode" = '02445', "latitude" = 42.3318, "longitude" = -71.1212 WHERE "city" = 'Brookline';

-- ============================================
-- 3. CREATE WEEKLY SALES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "WeeklySales" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT,
    "weekStart" DATE NOT NULL,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "estimates" INTEGER NOT NULL DEFAULT 0,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "channels" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklySales_pkey" PRIMARY KEY ("id")
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS "WeeklySales_weekStart_idx" ON "WeeklySales"("weekStart");
CREATE INDEX IF NOT EXISTS "WeeklySales_userId_idx" ON "WeeklySales"("userId");

-- Add trigger for updatedAt
CREATE TRIGGER set_timestamp_weekly_sales
BEFORE UPDATE ON "WeeklySales"
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================
-- 4. UPDATE KNOWLEDGE ARTICLE FOR CHECKLIST
-- ============================================

-- Add checklist and images columns if not exist
ALTER TABLE "KnowledgeArticle"
ADD COLUMN IF NOT EXISTS "checklist" JSONB DEFAULT '[]';

ALTER TABLE "KnowledgeArticle"
ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT '{}';

ALTER TABLE "KnowledgeArticle"
ADD COLUMN IF NOT EXISTS "videoUrl" TEXT DEFAULT '';

-- ============================================
-- 5. UPDATE VTO TABLE FOR FULL DATA
-- ============================================

ALTER TABLE "VTO"
ADD COLUMN IF NOT EXISTS "leadConversionRate" DOUBLE PRECISION DEFAULT 85;

ALTER TABLE "VTO"
ADD COLUMN IF NOT EXISTS "coreValues" TEXT DEFAULT '';

ALTER TABLE "VTO"
ADD COLUMN IF NOT EXISTS "coreFocus" TEXT DEFAULT '';

ALTER TABLE "VTO"
ADD COLUMN IF NOT EXISTS "tenYearTarget" TEXT DEFAULT '';

ALTER TABLE "VTO"
ADD COLUMN IF NOT EXISTS "threeYearPicture" TEXT DEFAULT '';

-- ============================================
-- 6. UPDATE BUSINESS SETTINGS FOR CHANNELS
-- ============================================

ALTER TABLE "BusinessSettings"
ADD COLUMN IF NOT EXISTS "companyName" TEXT DEFAULT 'PaintPro';

ALTER TABLE "BusinessSettings"
ADD COLUMN IF NOT EXISTS "salesCommissionPct" DOUBLE PRECISION DEFAULT 5;

ALTER TABLE "BusinessSettings"
ADD COLUMN IF NOT EXISTS "pmCommissionPct" DOUBLE PRECISION DEFAULT 3;

ALTER TABLE "BusinessSettings"
ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';

ALTER TABLE "BusinessSettings"
ADD COLUMN IF NOT EXISTS "dateFormat" TEXT DEFAULT 'MM/DD/YYYY';

ALTER TABLE "BusinessSettings"
ADD COLUMN IF NOT EXISTS "marketingChannels" JSONB DEFAULT '[
  {"id": "google", "label": "Google Ads", "color": "bg-blue-500"},
  {"id": "facebook", "label": "Facebook Ads", "color": "bg-indigo-500"},
  {"id": "referral", "label": "Referral", "color": "bg-green-500"},
  {"id": "yard_sign", "label": "Yard Sign", "color": "bg-yellow-500"},
  {"id": "door_knock", "label": "Door Knock", "color": "bg-orange-500"},
  {"id": "repeat", "label": "Repeat Client", "color": "bg-purple-500"},
  {"id": "other", "label": "Other", "color": "bg-gray-500"}
]';

-- ============================================
-- 7. UPDATE ROCK TABLE FOR MILESTONES
-- ============================================

ALTER TABLE "Rock"
ADD COLUMN IF NOT EXISTS "rockType" TEXT DEFAULT 'company';

ALTER TABLE "Rock"
ADD COLUMN IF NOT EXISTS "milestones" JSONB DEFAULT '[]';

ALTER TABLE "Rock"
ADD COLUMN IF NOT EXISTS "statusHistory" JSONB DEFAULT '[]';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that all columns were added
SELECT
  'WeeklySales' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'WeeklySales';

SELECT
  'Subcontractor.color' as column_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Subcontractor' AND column_name = 'color'
  ) as exists;

SELECT
  'Job.latitude' as column_name,
  EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Job' AND column_name = 'latitude'
  ) as exists;

-- ============================================
-- SAMPLE DATA FOR WEEKLY SALES
-- ============================================

INSERT INTO "WeeklySales" ("weekStart", "leads", "estimates", "sales", "revenue", "channels") VALUES
('2024-12-02', 15, 10, 3, 28500, '{"google": {"leads": 8, "estimates": 5, "sales": 2, "revenue": 19000}, "facebook": {"leads": 4, "estimates": 3, "sales": 1, "revenue": 9500}, "referral": {"leads": 3, "estimates": 2, "sales": 0, "revenue": 0}}'),
('2024-12-09', 12, 8, 2, 21000, '{"google": {"leads": 6, "estimates": 4, "sales": 1, "revenue": 12000}, "facebook": {"leads": 3, "estimates": 2, "sales": 1, "revenue": 9000}, "referral": {"leads": 3, "estimates": 2, "sales": 0, "revenue": 0}}'),
('2024-12-16', 18, 12, 4, 38000, '{"google": {"leads": 10, "estimates": 7, "sales": 2, "revenue": 19000}, "facebook": {"leads": 5, "estimates": 3, "sales": 1, "revenue": 9500}, "referral": {"leads": 3, "estimates": 2, "sales": 1, "revenue": 9500}}')
ON CONFLICT DO NOTHING;

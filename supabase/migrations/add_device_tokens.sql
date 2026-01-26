-- Add DeviceToken table for push notifications
-- Run: supabase db push

CREATE TABLE IF NOT EXISTS "DeviceToken" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID,
  "subcontractorId" UUID REFERENCES "Subcontractor"(id) ON DELETE CASCADE,
  "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastUsedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(token)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_device_token_sub ON "DeviceToken"("subcontractorId") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_device_token_user ON "DeviceToken"("userId") WHERE "isActive" = true;

-- RLS policies
ALTER TABLE "DeviceToken" ENABLE ROW LEVEL SECURITY;

-- Allow subcontractors to manage their own tokens
CREATE POLICY "Subcontractors can manage own tokens" ON "DeviceToken"
  FOR ALL
  USING ("subcontractorId" IS NOT NULL)
  WITH CHECK ("subcontractorId" IS NOT NULL);

-- Allow admins to view tokens for their org
CREATE POLICY "Admins can view org tokens" ON "DeviceToken"
  FOR SELECT
  USING ("organizationId" IS NOT NULL);

-- Add notification history table
CREATE TABLE IF NOT EXISTS "PushNotificationLog" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "deviceTokenId" UUID REFERENCES "DeviceToken"(id) ON DELETE SET NULL,
  "recipientType" TEXT NOT NULL CHECK ("recipientType" IN ('admin', 'sub')),
  "recipientId" UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  "errorMessage" TEXT,
  "sentAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for log lookups
CREATE INDEX IF NOT EXISTS idx_push_log_recipient ON "PushNotificationLog"("recipientType", "recipientId");

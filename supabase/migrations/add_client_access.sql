-- Add Client Portal Access Tables
-- Run: supabase db push

-- Client access tokens for magic link access
CREATE TABLE IF NOT EXISTS "ClientAccessToken" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "jobId" UUID NOT NULL REFERENCES "Job"(id) ON DELETE CASCADE,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  token VARCHAR(100) UNIQUE NOT NULL,
  "clientEmail" VARCHAR(255) NOT NULL,
  "clientName" VARCHAR(255),
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastAccessedAt" TIMESTAMP WITH TIME ZONE,
  "accessCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client messages (communication with admin)
CREATE TABLE IF NOT EXISTS "ClientMessage" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "accessTokenId" UUID NOT NULL REFERENCES "ClientAccessToken"(id) ON DELETE CASCADE,
  "jobId" UUID NOT NULL REFERENCES "Job"(id) ON DELETE CASCADE,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "authorType" TEXT NOT NULL CHECK ("authorType" IN ('client', 'admin')),
  "authorName" TEXT NOT NULL,
  message TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client viewed photos (track what they've seen)
CREATE TABLE IF NOT EXISTS "ClientPhotoView" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "accessTokenId" UUID NOT NULL REFERENCES "ClientAccessToken"(id) ON DELETE CASCADE,
  "photoId" UUID NOT NULL,
  "viewedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("accessTokenId", "photoId")
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_client_token ON "ClientAccessToken"(token) WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS idx_client_token_job ON "ClientAccessToken"("jobId");
CREATE INDEX IF NOT EXISTS idx_client_message_token ON "ClientMessage"("accessTokenId");
CREATE INDEX IF NOT EXISTS idx_client_message_job ON "ClientMessage"("jobId");

-- RLS policies
ALTER TABLE "ClientAccessToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientPhotoView" ENABLE ROW LEVEL SECURITY;

-- Allow public read for valid tokens (no RLS needed for public access)
-- Admin can manage all tokens in their org
CREATE POLICY "Admins can manage org tokens" ON "ClientAccessToken"
  FOR ALL
  USING ("organizationId" IS NOT NULL)
  WITH CHECK ("organizationId" IS NOT NULL);

CREATE POLICY "Admins can view org messages" ON "ClientMessage"
  FOR ALL
  USING ("organizationId" IS NOT NULL)
  WITH CHECK ("organizationId" IS NOT NULL);

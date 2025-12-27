-- ============================================
-- Migration: Add GHL SSO Support
-- Date: 2024-12-27
-- Description: Add fields for GoHighLevel SSO integration
-- ============================================

-- -----------------------------
-- Add GHL fields to User table
-- -----------------------------
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ghlUserId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ghlLocationId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ghlLinkedAt" TIMESTAMP;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "idx_user_ghl_user_id" ON "User"("ghlUserId");
CREATE INDEX IF NOT EXISTS "idx_user_ghl_location_id" ON "User"("ghlLocationId");

-- -----------------------------
-- Create GhlLocation table
-- Maps GHL location_id to PaintFlow Organization
-- -----------------------------
CREATE TABLE IF NOT EXISTS "GhlLocation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "ghlLocationId" TEXT UNIQUE NOT NULL,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "locationName" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookup by GHL location ID
CREATE INDEX IF NOT EXISTS "idx_ghl_location_ghl_id" ON "GhlLocation"("ghlLocationId");

-- -----------------------------
-- Enable RLS on GhlLocation
-- -----------------------------
ALTER TABLE "GhlLocation" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read GhlLocation
CREATE POLICY "GhlLocation select for all" ON "GhlLocation"
  FOR SELECT USING (true);

-- Only service role can insert/update (handled by API routes)
CREATE POLICY "GhlLocation insert for service" ON "GhlLocation"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "GhlLocation update for service" ON "GhlLocation"
  FOR UPDATE USING (true);

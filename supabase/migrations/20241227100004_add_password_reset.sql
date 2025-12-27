-- ============================================
-- Migration: Add Password Reset Support
-- Date: 2024-12-27
-- Description: Add table for password reset tokens
-- ============================================

-- -----------------------------
-- Create PasswordReset table
-- -----------------------------
CREATE TABLE IF NOT EXISTS "PasswordReset" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "token" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "usedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS "idx_password_reset_token" ON "PasswordReset"("token");
CREATE INDEX IF NOT EXISTS "idx_password_reset_user" ON "PasswordReset"("userId");

-- -----------------------------
-- Enable RLS
-- -----------------------------
ALTER TABLE "PasswordReset" ENABLE ROW LEVEL SECURITY;

-- Only service role can access (handled by API routes)
CREATE POLICY "PasswordReset service only" ON "PasswordReset"
  FOR ALL USING (true);

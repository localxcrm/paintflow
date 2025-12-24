-- Create PushSubscription table for storing Web Push subscriptions
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public."PushSubscription" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "endpoint" TEXT NOT NULL UNIQUE,
    "keys" JSONB NOT NULL,
    "organizationId" TEXT REFERENCES public."Organization"("id") ON DELETE CASCADE,
    "workOrderToken" TEXT,
    "userType" TEXT NOT NULL CHECK ("userType" IN ('admin', 'subcontractor')),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_push_subscription_org
    ON public."PushSubscription"("organizationId", "userType");

CREATE INDEX IF NOT EXISTS idx_push_subscription_token
    ON public."PushSubscription"("workOrderToken");

CREATE INDEX IF NOT EXISTS idx_push_subscription_endpoint
    ON public."PushSubscription"("endpoint");

-- Enable Row Level Security
ALTER TABLE public."PushSubscription" ENABLE ROW LEVEL SECURITY;

-- Allow all operations from service role (server-side)
CREATE POLICY "Service role full access" ON public."PushSubscription"
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE public."PushSubscription" IS 'Stores Web Push notification subscriptions for admin and subcontractor users';

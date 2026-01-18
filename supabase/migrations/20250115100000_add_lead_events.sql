-- Migration: Add Lead Events table and increment function for GHL webhook integration
-- This enables automatic tracking of leads, estimates, and sales from GoHighLevel webhooks

-- 1. Create LeadEvent table to log all webhook events with attribution
CREATE TABLE IF NOT EXISTS "LeadEvent" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "ghlContactId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL, -- 'lead_created', 'appointment_booked', 'estimate_sent', 'contract_signed', 'job_won', 'job_lost'
  "channel" TEXT, -- Maps to existing channels: 'google', 'facebook', 'referral', 'yard_sign', 'door_knock', 'repeat', 'site', 'other'
  "eventData" JSONB, -- Full webhook payload for debugging/analysis
  -- Attribution fields
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "referrer" TEXT,
  "landingPage" TEXT,
  "sessionSource" TEXT,
  "gclid" TEXT,
  "fbclid" TEXT,
  "gaClientId" TEXT,
  -- Client info
  "clientName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "jobValue" NUMERIC,
  "projectType" TEXT,
  -- Timestamps
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for LeadEvent
CREATE INDEX IF NOT EXISTS idx_lead_event_org ON "LeadEvent"("organizationId");
CREATE INDEX IF NOT EXISTS idx_lead_event_ghl_contact ON "LeadEvent"("ghlContactId");
CREATE INDEX IF NOT EXISTS idx_lead_event_type ON "LeadEvent"("eventType");
CREATE INDEX IF NOT EXISTS idx_lead_event_channel ON "LeadEvent"("channel");
CREATE INDEX IF NOT EXISTS idx_lead_event_created ON "LeadEvent"("createdAt");
CREATE INDEX IF NOT EXISTS idx_lead_event_org_type ON "LeadEvent"("organizationId", "eventType");

-- 2. Add GHL fields to Job table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "ghlContactId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "ghlOpportunityId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "leadSource" TEXT;

-- Index for GHL lookups on Job
CREATE INDEX IF NOT EXISTS idx_job_ghl_contact ON "Job"("ghlContactId");
CREATE INDEX IF NOT EXISTS idx_job_lead_source ON "Job"("leadSource");

-- 3. Create function to increment WeeklySales channel data
-- This function handles upsert + increment for webhook automation
CREATE OR REPLACE FUNCTION increment_weekly_sales(
  p_org_id TEXT,
  p_week_start DATE,
  p_channel TEXT,
  p_field TEXT, -- 'leads', 'estimates', 'sales'
  p_amount INTEGER DEFAULT 1,
  p_revenue NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_record RECORD;
  v_channels JSONB;
  v_channel_data JSONB;
  v_result JSONB;
BEGIN
  -- Get existing record or create empty structure
  SELECT * INTO v_existing_record
  FROM "WeeklySales"
  WHERE "organizationId" = p_org_id AND "weekStart" = p_week_start;

  IF v_existing_record IS NULL THEN
    -- Create new record with initial channel data
    v_channel_data := jsonb_build_object(
      'leads', CASE WHEN p_field = 'leads' THEN p_amount ELSE 0 END,
      'estimates', CASE WHEN p_field = 'estimates' THEN p_amount ELSE 0 END,
      'sales', CASE WHEN p_field = 'sales' THEN p_amount ELSE 0 END,
      'revenue', CASE WHEN p_field = 'sales' THEN p_revenue ELSE 0 END
    );
    v_channels := jsonb_build_object(p_channel, v_channel_data);

    INSERT INTO "WeeklySales" (
      "organizationId", "weekStart", "leads", "estimates", "sales", "revenue", "channels"
    ) VALUES (
      p_org_id,
      p_week_start,
      CASE WHEN p_field = 'leads' THEN p_amount ELSE 0 END,
      CASE WHEN p_field = 'estimates' THEN p_amount ELSE 0 END,
      CASE WHEN p_field = 'sales' THEN p_amount ELSE 0 END,
      CASE WHEN p_field = 'sales' THEN p_revenue ELSE 0 END,
      v_channels
    )
    RETURNING jsonb_build_object('id', id, 'weekStart', "weekStart", 'channels', channels) INTO v_result;
  ELSE
    -- Update existing record
    v_channels := COALESCE(v_existing_record.channels, '{}'::jsonb);

    -- Get existing channel data or create empty
    v_channel_data := COALESCE(v_channels->p_channel, '{"leads":0,"estimates":0,"sales":0,"revenue":0}'::jsonb);

    -- Increment the specific field
    v_channel_data := v_channel_data || jsonb_build_object(
      p_field, (COALESCE((v_channel_data->>p_field)::integer, 0) + p_amount)
    );

    -- If it's a sale, also add revenue
    IF p_field = 'sales' AND p_revenue > 0 THEN
      v_channel_data := v_channel_data || jsonb_build_object(
        'revenue', (COALESCE((v_channel_data->>'revenue')::numeric, 0) + p_revenue)
      );
    END IF;

    -- Update channels object
    v_channels := v_channels || jsonb_build_object(p_channel, v_channel_data);

    -- Update the record
    UPDATE "WeeklySales"
    SET
      "leads" = "leads" + CASE WHEN p_field = 'leads' THEN p_amount ELSE 0 END,
      "estimates" = "estimates" + CASE WHEN p_field = 'estimates' THEN p_amount ELSE 0 END,
      "sales" = "sales" + CASE WHEN p_field = 'sales' THEN p_amount ELSE 0 END,
      "revenue" = "revenue" + CASE WHEN p_field = 'sales' THEN p_revenue ELSE 0 END,
      "channels" = v_channels,
      "updatedAt" = NOW()
    WHERE "id" = v_existing_record.id
    RETURNING jsonb_build_object('id', id, 'weekStart', "weekStart", 'channels', channels) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- 4. Create helper function to get week start (Monday) from a date
CREATE OR REPLACE FUNCTION get_week_start(p_date DATE)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Return the Monday of the week containing p_date
  RETURN p_date - ((EXTRACT(ISODOW FROM p_date)::integer - 1) % 7);
END;
$$;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_weekly_sales TO authenticated;
GRANT EXECUTE ON FUNCTION increment_weekly_sales TO service_role;
GRANT EXECUTE ON FUNCTION get_week_start TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_start TO service_role;

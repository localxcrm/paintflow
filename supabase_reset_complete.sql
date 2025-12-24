-- Add settings column to Organization table for feature flags
ALTER TABLE "Organization" 
ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}';

-- Update existing organizations to have default settings
UPDATE "Organization"
SET "settings" = '{"aiAssistant": true, "customDomain": false, "advancedEstimating": true}'
WHERE "settings" IS NULL OR "settings" = '{}';


# Database Configuration (Supabase PostgreSQL)
# Get this from: Supabase Dashboard > Settings > Database > Connection String > URI
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:YOUR-PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection for migrations (without pgbouncer)
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:YOUR-PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase Configuration
# Get these from: Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL="https://accbcdxiuaheynxzorzq.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjY2JjZHhpdWFoZXlueHpvcnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDE3NzEsImV4cCI6MjA4MTgxNzc3MX0.OH5WzH4Tr2mZIrKzc_QHzINA3o2_U1eyIOa9fY0A1N8"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjY2JjZHhpdWFoZXlueHpvcnpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI0MTc3MSwiZXhwIjoyMDgxODE3NzcxfQ.E8j8b4n9Bbr6K779p-2nWoOEGlzQFRy6O3Y1jfsDzKk"

# OpenAI API Key (for AI Assistant)
OPENAI_API_KEY="your-openai-api-key-here"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

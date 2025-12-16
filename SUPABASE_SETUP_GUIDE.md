# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Project Name**: `paintpro-os` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Pricing Plan**: Free tier is fine for development
5. Click "Create new project"
6. Wait 2-3 minutes for provisioning

## Step 2: Apply Database Schema

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase_schema.sql` file in this project
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. Wait for execution to complete
7. You should see "Success. No rows returned" message

## Step 3: Verify Tables Created

1. Go to **Table Editor** (left sidebar)
2. You should see all 25+ tables:
   - User
   - Session
   - BusinessSettings
   - TeamMember
   - Subcontractor
   - Lead
   - Estimate
   - EstimateLineItem
   - EstimateSignature
   - Job
   - RoomPrice
   - ExteriorPrice
   - Addon
   - VTO
   - Rock
   - Todo
   - Issue
   - Seat
   - Meeting
   - ScorecardMetric
   - ScorecardEntry
   - PeopleAnalyzer
   - CompanyEstimateSettings
   - PortfolioImage
   - AIConversation
   - AIMessage

## Step 4: Get API Credentials

1. Go to **Settings** → **API** (left sidebar)
2. Copy the following values:

   **Project URL:**
   ```
   https://[YOUR-PROJECT-REF].supabase.co
   ```

   **anon/public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **service_role key:** (keep this secret!)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 5: Create .env File

Create a `.env` file in the root of this project with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# OpenAI (optional - for AI features)
OPENAI_API_KEY="your-openai-key-if-you-have-one"

# App Configuration
NODE_ENV="development"
```

Replace:
- `[YOUR-PROJECT-REF]` with your actual project reference
- `your-anon-key-here` with the anon/public key
- `your-service-role-key-here` with the service role key

## Step 6: Test Connection

After I've finished the migration code, you'll be able to test the connection by running:

```bash
npm run dev
```

## Important Notes

- **Never commit the `.env` file to git** - it's already in .gitignore
- The **service_role key** bypasses Row Level Security - keep it secret
- The **anon key** is safe to use in browser/client-side code
- You can always find these keys again in Settings → API

## What's Next

Once you complete these steps and provide me confirmation:
1. I'll continue removing Prisma dependencies
2. I'll rewrite all API routes to use Supabase
3. I'll create a seed script to populate initial data
4. We'll test the entire application

## Troubleshooting

**If SQL script fails:**
- Check if all previous queries completed successfully
- Try running the script in smaller chunks
- Check the error message in the SQL editor

**If you can't find your project:**
- Check you're logged into the correct Supabase account
- Projects are listed at https://supabase.com/dashboard/projects

**If connection fails later:**
- Double-check the PROJECT_REF in the URL matches your project
- Verify the API keys are copied correctly (no extra spaces)
- Check the .env file is in the root directory

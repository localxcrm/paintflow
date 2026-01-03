# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PaintFlow is a multi-tenant SaaS business management system for Brazilian painting companies operating in the United States. It features lead management, estimates, job tracking, team coordination, subcontractor portal, and EOS/Traction implementation tools.

- **Language**: Portuguese (pt-BR) UI
- **Currency**: US Dollar (USD)
- **Date Format**: DD-MM-YY
- **Timezone**: US timezones
- **Deployment**: Vercel (app) + Supabase (database)
- **Mobile**: iOS via Capacitor

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run db:seed      # Seed database with sample data

# iOS (Capacitor)
npm run cap:sync     # Sync Capacitor iOS
npm run cap:open     # Open Xcode
npm run ios:dev      # Dev with iOS simulator
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: Supabase PostgreSQL (direct queries, no ORM)
- **UI**: Tailwind CSS 4 + shadcn/ui + Radix primitives
- **Forms**: React Hook Form + Zod validation
- **AI**: OpenAI GPT-4 Turbo with tool calling, Whisper (Portuguese), TTS

### Multi-Tenancy Model
- Organizations are the top-level tenant
- Users belong to organizations via `UserOrganization` join table
- All data queries filter by `organizationId`
- Organization ID stored in `paintpro_org_id` cookie

### Authentication
- **Admin users**: Session-based auth with `paintpro_session` cookie
- **Subcontractors**: Separate auth with `paintpro_sub_session` cookie
- **GHL SSO**: Single sign-on integration for GoHighLevel users
- Sessions validated server-side against `Session` table

### Route Groups
```
src/app/
├── (dashboard)/     # Main app (authenticated users)
├── (admin)/         # Super admin pages
├── (marketing)/     # Landing page
├── sub/             # Subcontractor portal (separate auth)
├── api/             # 70+ API endpoints
├── estimate/[id]/   # Public estimate viewing/signing
└── os/[token]/      # Public work order view
```

### Supabase Patterns

**Server-side** (API routes):
```typescript
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

const supabase = createServerSupabaseClient();
const orgId = getOrganizationIdFromRequest(request);
const { data } = await supabase.from('Job').select('*').eq('organizationId', orgId);
```

**Client-side**:
```typescript
import { getSupabaseClient } from '@/lib/supabase';
const supabase = getSupabaseClient(); // Singleton pattern
```

### Key Directories
- `src/lib/supabase-server.ts` - Server Supabase client, session validation, org helpers
- `src/lib/supabase.ts` - Client Supabase client, direct file uploads
- `src/middleware.ts` - Route protection, CORS for mobile, org/session validation
- `src/types/database.ts` - All TypeScript types for database models
- `src/contexts/organization-context.tsx` - React context for current organization

### API Route Pattern
All API routes follow this structure:
```typescript
export async function GET(request: Request) {
  const orgId = getOrganizationIdFromRequest(request);
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 400 });

  const supabase = createServerSupabaseClient();
  // Query with organizationId filter
}
```

### Database Schema (33 tables)
Core: `User`, `Session`, `Organization`, `UserOrganization`, `BusinessSettings`
Sales: `Lead`, `Estimate`, `EstimateLineItem`, `EstimateSignature`, `Job`
Team: `TeamMember`, `Subcontractor`, `WorkOrder`
Pricing: `RoomPrice`, `ExteriorPrice`, `Addon`
EOS: `VTO`, `Rock`, `Todo`, `Issue`, `Meeting`, `Seat`, `ScorecardMetric`, `PeopleAnalyzer`

### GHL Integration
- SSO via `/api/auth/ghl` endpoint
- Webhook for auto-creating jobs at `/api/webhooks/ghl/jobs`
- CORS headers configured in `next.config.ts` for iframe embedding

## Environment Variables

Required:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

# PaintFlow Analysis

## Overview

**PaintFlow** is a full-stack SaaS platform for professional painting contractors implementing the EOS/Traction methodology. It combines a web admin dashboard with an iOS mobile app for subcontractors.

**Domain:** https://os.prohousepaintersofputnam.com

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16.1.1, React 19.2.3, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| **Backend** | Next.js API Routes (serverless), Supabase PostgreSQL |
| **Mobile** | Capacitor 8.0.0 (iOS) with camera, push notifications, voice recorder |
| **AI** | OpenAI GPT-4 Turbo, Whisper (speech-to-text), TTS |
| **Auth** | Custom session-based + GoHighLevel SSO (HMAC-SHA256) |
| **Forms** | React Hook Form 7.68 + Zod 4.2 |
| **Charts** | Recharts 2.15.4 |
| **Maps** | Leaflet 1.9.4 + React Leaflet 5.0 |
| **Rich Text** | TinyMCE 6.3 |

---

## Architecture

```
paintflow/
├── src/
│   ├── app/                          # Next.js App Router (70+ routes)
│   │   ├── (marketing)/              # Public landing page
│   │   ├── (dashboard)/              # Main admin app (protected)
│   │   ├── api/                      # 52+ API endpoints (serverless)
│   │   ├── sub/                      # Subcontractor portal
│   │   ├── auth/                     # SSO callback
│   │   ├── login, register/          # Auth pages
│   │   └── [public routes]/          # /estimate/[id], /os/[token]
│   │
│   ├── components/                   # React components (50+)
│   │   ├── ui/                       # shadcn/ui + Radix (34 components)
│   │   ├── layout/                   # Header, navigation
│   │   ├── dashboard/                # Dashboard widgets
│   │   ├── jobs/                     # Job management
│   │   ├── estimates/                # Estimate builder
│   │   ├── chat/                     # Chat UI
│   │   ├── sub/                      # Subcontractor UI
│   │   └── [others]/                 # price-book, sop-editor, etc.
│   │
│   ├── lib/                          # Core utilities & logic
│   │   ├── api/                      # API client wrappers
│   │   ├── supabase.ts               # Client-side Supabase
│   │   ├── supabase-server.ts        # Server-side Supabase
│   │   ├── auth.ts                   # Auth helpers
│   │   ├── openai.ts                 # OpenAI integration
│   │   ├── ghl.ts                    # GoHighLevel SSO
│   │   └── utils/                    # Calculations
│   │
│   ├── types/                        # TypeScript definitions (40+ interfaces)
│   ├── contexts/                     # React Context API
│   ├── hooks/                        # Custom React hooks
│   └── middleware.ts                 # Auth & org routing
│
├── supabase/                         # Database migrations
├── ios/                              # iOS app (Capacitor)
├── public/                           # Static assets
└── scripts/                          # Utility scripts
```

---

## Core Features

### Admin Dashboard

#### Business Management
- **Lead Management** - Track leads through sales pipeline (8 statuses)
- **Estimates** - Professional estimates with line items, digital signatures, pricing intelligence
- **Job Tracking** - Full job lifecycle with financial calculations and progress tracking
- **Team Management** - Roles (sales, pm, both), commission tracking
- **Subcontractor Management** - Assign contractors, track payouts, manage specialties

#### Financial & Pricing
- **Price Book** - Dynamic pricing for room types, exterior work, add-ons
- **Financial Dashboard** - Revenue, margins, profit analysis
- **Business Settings** - Payout percentages, deposit %, pricing rules
- **Marketing Spend** - Track marketing channel spend
- **Weekly Sales** - Sales metrics and analytics

#### EOS/Traction Tools
- **Vision/Traction Organizer (VTO)** - Company vision, 10-year target, 3-year goal
- **Rocks** - Quarterly goals with tracking
- **Scorecard** - Weekly performance metrics (leading/lagging)
- **Issues List** - Issue tracking with resolution workflow
- **Meeting Management** - Level 10 meeting structure
- **Accountability Chart** - Organizational structure
- **People Analyzer** - GWC evaluation (Gets it, Wants it, Capacity)

#### Additional Features
- **Map View** - Leaflet map of all active jobs
- **Knowledge Base** - Company documentation
- **Training Hub** - Subcontractor courses with video
- **AI Assistant** - GPT-4 powered chat

### Subcontractor Portal (iOS Mobile App)

- **Job Dashboard** - List, calendar, and map views
- **Work Order Tracking** - Photo uploads, task completion, progress
- **Real-time Chat** - Messaging with company
- **Push Notifications** - Job updates and messages
- **Training Courses** - Video-based learning

### Public Pages

- **Landing Page** - Marketing site
- **Public Estimate** - View & digitally sign estimates
- **Public Work Order** - View work order via public token

---

## API Endpoints (52+)

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/ghl` (GoHighLevel SSO)
- `POST /api/auth/me`

### Subcontractor Routes
- `POST/GET /api/sub/login`
- `GET /api/sub/me`
- `GET /api/sub/jobs`
- `GET /api/sub/os/[id]`
- `POST /api/sub/os/upload`
- `GET /api/sub/chats`
- `GET/POST /api/sub/chats/[id]`
- `GET/POST /api/sub/chats/[id]/messages`
- `GET/POST /api/sub/training`
- `GET /api/sub/training/courses`

### Business Data
- Organizations, Teams, Subcontractors
- Jobs, Leads, Estimates
- Work Orders, Rooms, Pricing
- Settings, Portfolio Images

### EOS/Traction
- `/api/vto` - Vision tracking
- `/api/rocks` - Goals
- `/api/scorecard` - Metrics

### Webhooks
- `/api/webhooks/ghl` - GoHighLevel integration

---

## Database Schema (40+ Tables)

### Core Tables
- `User` - Login users with GHL SSO fields
- `Session` - Session tracking with expiry
- `Organization` - Multi-tenant companies
- `UserOrganization` - User-org relationships with roles
- `Subcontractor` - Contractor tracking
- `TeamMember` - Internal team

### Business Data
- `Lead` - Sales pipeline
- `Estimate` - Quotes with line items & signatures
- `Job` - Project tracking
- `WorkOrder` - Detailed work tasks
- `RoomPrice`, `ExteriorPrice`, `Addon` - Pricing catalog

### EOS/Traction
- `VTO` - Vision/Traction
- `Rock` - Quarterly goals
- `Issue`, `Todo` - Task tracking
- `Meeting` - Meeting notes
- `Seat` - Accountability
- `ScorecardMetric`, `ScorecardEntry` - Weekly metrics
- `PeopleAnalyzer` - GWC ratings

### Content
- `AIConversation`, `AIMessage` - Chat history
- `PortfolioImage` - Work samples
- `ChatMessage` - Team messaging
- `KnowledgeArticle` - Documentation

---

## Notable Patterns & Practices

### Architecture Patterns

1. **API Client Wrapper Pattern**
   - `ApiClient` base class with `post()`, `get()`, `put()`, `delete()` methods
   - Domain-specific wrappers: `jobsApi`, `estimatesApi`, `leadsApi`, etc.

2. **Server-Side vs Client-Side Separation**
   - `lib/supabase.ts` - Client-side (browser safe)
   - `lib/supabase-server.ts` - Server-side only (service role key)

3. **Multi-Tenancy**
   - Organization ID separation via cookies/headers
   - All queries filtered by `organizationId`
   - RLS policies in Supabase

4. **Authentication Strategy**
   - Custom session system (not Supabase Auth)
   - Admin: `paintpro_session` cookie
   - Subcontractor: `paintpro_sub_session` cookie
   - GHL SSO with HMAC-SHA256 signature verification

5. **Component Organization**
   - Smart components: Fetch data, manage state
   - Dumb components: Pure presentational (shadcn/ui)
   - Folder-per-feature structure

### Security Features

- SHA-256 password hashing with salt
- Secure token generation (64-char alphanumeric)
- CORS for mobile API (`/api/sub/*`)
- RLS policies on Supabase tables
- Session expiry (7 days)

### Internationalization

- **Portuguese (pt-BR)** as primary language
- Date formatting with pt-BR locale
- US States dropdown for address forms

---

## Infrastructure

| Service | Provider |
|---------|----------|
| **Frontend/API** | Vercel (auto-deploys) |
| **Database** | Supabase PostgreSQL |
| **File Storage** | Supabase Storage |
| **Mobile** | iOS via Capacitor |

---

## Development Commands

```bash
# Start development
npm run dev                    # Next.js dev server (http://localhost:3000)
npm run ios:dev                # Dev server + iOS simulator
npx cap sync ios               # Sync web changes to iOS

# Database
npm run db:seed                # Seed Supabase with test data

# Build
npm run build                  # Build for production
npm run start                  # Start production server
```

---

## Key Dependencies

| Category | Libraries |
|----------|-----------|
| **Frontend** | next, react, react-dom, typescript, tailwindcss |
| **UI** | @radix-ui/*, shadcn/ui, lucide-react |
| **Forms** | react-hook-form, zod, @hookform/resolvers |
| **Data** | @supabase/supabase-js, recharts |
| **Maps** | leaflet, react-leaflet |
| **AI** | openai, @tinymce/tinymce-react |
| **Mobile** | @capacitor/*, capacitor-voice-recorder |
| **Utils** | date-fns, clsx, tailwind-merge, web-push |

---

## Summary

PaintFlow is a production-ready SaaS platform with:

- **70+ routes** across admin and subcontractor portals
- **52+ API endpoints** for all business operations
- **40+ database tables** with proper security
- **Full-stack TypeScript** with strict type safety
- **EOS/Traction methodology** embedded in features
- **Mobile-first design** using Capacitor
- **AI integration** with OpenAI GPT-4
- **Third-party integration** with GoHighLevel

The codebase demonstrates professional architecture patterns and is ready for scale.

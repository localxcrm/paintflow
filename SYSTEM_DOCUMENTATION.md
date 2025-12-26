# PAINTFLOW - SYSTEM DOCUMENTATION

## 1. PROJECT OVERVIEW

**PaintFlow** is a comprehensive business management system for painting companies in Brazil. It implements the EOS/Traction methodology and provides tools for lead management, estimates, job tracking, team coordination, and subcontractor management.

| Property | Value |
|----------|-------|
| **Type** | Full-stack SaaS web + mobile app |
| **Industry** | Painting contractors |
| **Language** | Portuguese (pt-BR) primary |
| **Deployment** | Vercel + Supabase |
| **Mobile** | iOS via Capacitor |
| **Version** | 0.1.0 |

---

## 2. TECH STACK

### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5
- **UI**: React 19 + shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Maps**: Leaflet + React Leaflet
- **Rich Editor**: TinyMCE

### Backend & Database
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase PostgreSQL
- **Auth**: Session-based (cookies)

### Mobile
- **Framework**: Capacitor 8.0.0 (iOS)
- **Plugins**: Camera, Push Notifications, Haptics, Keyboard

### AI & External
- **AI**: OpenAI GPT-4 Turbo
- **Speech**: Whisper API (Portuguese)
- **TTS**: OpenAI TTS-1
- **Push**: Web Push + VAPID

---

## 3. DIRECTORY STRUCTURE

```
paintflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/            # Admin pages
│   │   ├── (dashboard)/        # Main app (59 pages)
│   │   ├── (marketing)/        # Landing page
│   │   ├── api/                # 52 API endpoints
│   │   ├── sub/                # Subcontractor portal (11 pages)
│   │   ├── estimate/[id]/      # Public estimate view
│   │   ├── os/[token]/         # Public work order view
│   │   └── login/, register/   # Auth pages
│   ├── components/             # React components
│   │   ├── ui/                 # 34 shadcn/ui components
│   │   ├── layout/             # Header, navigation
│   │   ├── jobs/               # Job management (11)
│   │   ├── dashboard/          # Dashboard widgets (6)
│   │   ├── estimates/          # Estimate components
│   │   ├── chat/               # Chat UI (3)
│   │   ├── sub/                # Subcontractor (6)
│   │   └── work-orders/        # Work order (2)
│   ├── lib/                    # Utilities
│   │   ├── api/                # API client wrappers
│   │   ├── supabase.ts         # Supabase client
│   │   ├── openai.ts           # OpenAI integration
│   │   └── ai-tools.ts         # AI tool definitions
│   ├── types/                  # TypeScript types
│   ├── contexts/               # React contexts
│   └── hooks/                  # Custom hooks
├── supabase/                   # Database migrations
├── scripts/                    # Utility scripts
├── ios/                        # iOS app (Capacitor)
└── public/                     # Static assets
```

---

## 4. ALL PAGES (70+ Routes)

### Authentication
| Route | Purpose |
|-------|---------|
| `/login` | Admin login |
| `/register` | User registration |
| `/select-org` | Organization selection |

### Main Dashboard (59 pages)
| Route | Purpose |
|-------|---------|
| `/dashboard` | Main KPI dashboard |
| `/jobs` | Job list with filtering |
| `/jobs/[id]` | Job detail |
| `/leads` | Lead management |
| `/estimates` | Estimate list |
| `/estimates/new` | Create estimate |
| `/estimates/settings` | Templates, portfolio, terms |
| `/equipe` | Team management |
| `/mapa` | Map view of jobs |
| `/metas` | Goals dashboard |
| `/marketing` | Marketing spend |
| `/vendas` | Sales analytics |
| `/financials` | Financial metrics |
| `/price-book` | Pricing management |
| `/conhecimento` | Knowledge base |
| `/treinamento-sub` | Subcontractor training |
| `/perfil` | User profile |
| `/configuracoes` | Settings |

### EOS/Traction Tools
| Route | Purpose |
|-------|---------|
| `/traction/vto` | Vision/Traction Organizer |
| `/traction/rocks` | Quarterly goals |
| `/traction/scorecard` | Weekly metrics |
| `/traction/issues` | Issue tracking |
| `/traction/todos` | Task management |
| `/traction/meetings` | Meeting notes |
| `/traction/accountability` | Org chart |
| `/traction/people` | People analyzer (GWC) |

### Subcontractor Portal
| Route | Purpose |
|-------|---------|
| `/sub/login` | Subcontractor login |
| `/sub/dashboard` | Subcontractor dashboard |
| `/sub/os` | Work order list |
| `/sub/os/[id]` | Work order detail |
| `/sub/chat` | Chat with company |
| `/sub/treinamento` | Training courses |
| `/sub/perfil` | Profile management |

### Public Pages
| Route | Purpose |
|-------|---------|
| `/estimate/[id]` | Public estimate view & signing |
| `/os/[token]` | Public work order view |

---

## 5. API ENDPOINTS (52)

### Authentication
```
POST /api/auth/register    - User registration
POST /api/auth/login       - Login
GET  /api/auth/me          - Current user
POST /api/auth/logout      - Logout
```

### Jobs
```
GET  /api/jobs             - List jobs (filter, paginate)
POST /api/jobs             - Create job
GET  /api/jobs/[id]        - Get job detail
PUT  /api/jobs/[id]        - Update job
DELETE /api/jobs/[id]      - Delete job
```

### Work Orders
```
GET  /api/work-orders      - List work orders
POST /api/work-orders      - Create work order
GET  /api/work-orders/[id] - Get detail
PUT  /api/work-orders/[id] - Update
```

### AI
```
POST /api/ai/chat          - AI assistant chat
POST /api/ai/transcribe    - Audio transcription
POST /api/ai/speech        - Text-to-speech
```

### Push Notifications
```
POST /api/push/subscribe     - Subscribe
POST /api/push/device-token  - Register device
POST /api/push/send          - Send notification
```

### EOS/Traction
```
GET/PUT  /api/vto          - Vision/Traction Organizer
GET/POST /api/rocks        - Quarterly rocks
GET/POST /api/issues       - Issue tracking
GET/POST /api/scorecard    - Scorecard metrics
```

### Other
```
GET  /api/team             - Team members
GET  /api/subcontractors   - Subcontractors
GET  /api/settings         - Business settings
GET  /api/dashboard        - Dashboard KPIs
GET  /api/calendar/[token] - iCal feed
```

---

## 6. DATABASE SCHEMA (33 Tables)

### Core Tables
| Table | Purpose |
|-------|---------|
| `User` | User accounts |
| `Session` | Login sessions |
| `Organization` | Company accounts |
| `UserOrganization` | User-org relationships |
| `BusinessSettings` | Business configuration |

### Sales Pipeline
| Table | Purpose |
|-------|---------|
| `Lead` | Sales leads |
| `Estimate` | Price quotes |
| `EstimateLineItem` | Estimate line items |
| `EstimateSignature` | Digital signatures |
| `Job` | Completed/active jobs |

### Team & Subcontractors
| Table | Purpose |
|-------|---------|
| `TeamMember` | Employees |
| `Subcontractor` | Subcontractors |
| `WorkOrder` | Ordem de Serviço |

### Pricing
| Table | Purpose |
|-------|---------|
| `RoomPrice` | Room pricing |
| `ExteriorPrice` | Exterior pricing |
| `Addon` | Add-on pricing |

### EOS/Traction
| Table | Purpose |
|-------|---------|
| `VTO` | Vision/Traction Organizer |
| `Rock` | Quarterly goals |
| `Todo` | Task items |
| `Issue` | Issue tracking |
| `Meeting` | Meeting notes |
| `Seat` | Accountability chart |
| `ScorecardMetric` | Performance metrics |
| `ScorecardEntry` | Weekly values |
| `PeopleAnalyzer` | GWC evaluation |

### Other
| Table | Purpose |
|-------|---------|
| `AIConversation` | AI chat sessions |
| `AIMessage` | AI messages |
| `SubcontractorTraining` | Training courses |
| `PushSubscription` | Push subscriptions |
| `PortfolioImage` | Portfolio photos |
| `CompanyEstimateSettings` | Estimate customization |

---

## 7. KEY FEATURES

### Lead Management
- Lead creation with contact info and source tracking
- Pipeline: new → contacted → estimate_scheduled → estimated → proposal_sent → follow_up → won/lost
- Team assignment and follow-up scheduling

### Estimates & Quotes
- Professional estimates with line items
- Dynamic pricing from price book
- Financial calculations (gross profit, margins)
- Digital signature capture
- Public shareable links

### Job Management
- Full financial tracking (revenue, costs, commissions)
- Status: lead → got_the_job → scheduled → completed
- Geocoding with map display
- Profitability analysis

### Work Orders (Ordem de Serviço)
- Room/area breakdown
- Material and task checklists
- Photo tracking (before/during/after)
- Public mobile view for subcontractors

### AI Assistant
- GPT-4 Turbo with tool calling
- Search leads, jobs, get business stats
- Portuguese language support
- Voice input via Whisper

### EOS/Traction Implementation
- VTO (Vision/Traction Organizer)
- Quarterly Rocks (goals)
- Weekly Scorecard
- Issues List
- Accountability Chart
- People Analyzer (GWC)
- Meeting Management

### Dashboard & Analytics
- Real-time KPIs
- Revenue vs. goal tracking
- Lead conversion rates
- Job profitability

### Subcontractor Portal
- Dedicated login
- Work order management
- Photo uploads
- Direct messaging
- Training courses

### Mobile Features
- iOS app via Capacitor
- Native camera
- Push notifications

---

## 8. AUTHENTICATION

### Session Flow
1. User registers → org auto-created
2. Password hashed (SHA-256 + salt)
3. Session token generated (64-char)
4. Cookie set: `paintpro_session` (7-day expiry)

### Roles
- **User roles**: admin, user, viewer, subcontractor
- **Org roles**: owner, admin, member, viewer

### Protected Routes
- Public: `/`, `/login`, `/register`, estimate views
- Auth-only: `/dashboard/*`, `/admin/*`
- Subcontractor: `/sub/*` (separate session)

---

## 9. ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx

# Environment
NODE_ENV=production
```

---

## 10. NPM SCRIPTS

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:seed      # Seed database
npm run cap:sync     # Sync Capacitor iOS
npm run cap:open     # Open Xcode
npm run ios:dev      # Dev with iOS
```

---

## 11. DEPLOYMENT

| Service | Platform |
|---------|----------|
| **App** | Vercel |
| **Database** | Supabase |
| **iOS** | App Store (via Capacitor) |

### Vercel Project
- **Name**: painting-os-system
- **Team**: rodrigo-prohousepains-projects

### Supabase Project
- **ID**: accbcdxiuaheynxzorzq
- **URL**: https://accbcdxiuaheynxzorzq.supabase.co

---

## 12. EXTERNAL INTEGRATIONS

| Service | Purpose |
|---------|---------|
| **Supabase** | Database, Auth, Storage |
| **OpenAI** | AI chat, Whisper, TTS |
| **Capacitor** | iOS native features |
| **Web Push** | Browser notifications |
| **Leaflet** | Maps |
| **Google Places** | Address autocomplete |

---

*Document generated: December 26, 2025*

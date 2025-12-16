# PaintPro - Painting Business Management System

A comprehensive business management system built specifically for painting companies, featuring lead management, estimates, job tracking, team coordination, and EOS/Traction implementation tools.

## Features

### Core Business Management
- **Lead Management** - Track and manage sales pipeline with status tracking, assignment, and follow-ups
- **Estimates** - Create professional estimates with line items, pricing, and digital signatures
- **Job Management** - Track active jobs with financial calculations and progress monitoring
- **Team Management** - Manage team members with role assignments
- **Subcontractor Management** - Track subcontractor relationships and assignments

### Pricing & Settings
- **Dynamic Price Book** - Manage pricing for rooms, exterior work, and add-ons
- **Business Settings** - Configure company information and subcontractor payout percentages
- **Estimate Templates** - Customize estimate appearance and terms

### EOS/Traction Tools
- **Vision/Traction Organizer (VTO)** - Define core values, focus, and 10-year target
- **Rocks** - Quarterly goal tracking
- **Scorecard** - Performance metrics with weekly tracking
- **Issues List** - Issue tracking and resolution
- **Meeting Management** - Level 10 meeting structure
- **Accountability Chart** - Organizational structure and seats
- **People Analyzer** - GWC (Gets it, Wants it, Capacity) evaluation

### Additional Features
- **Dashboard** - Real-time KPIs and business metrics
- **AI Chat Assistant** - Business context-aware AI support
- **User Authentication** - Secure session-based authentication

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase PostgreSQL
- **Authentication:** Custom session-based auth
- **UI:** React with Tailwind CSS
- **TypeScript:** Full type safety
- **API:** RESTful API routes

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### 1. Clone the Repository

```bash
git clone https://github.com/localxcrm/paint-pro-os.git
cd paint-pro-os
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to provision

#### Run the Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase_schema.sql` from this repository
4. Paste and run the SQL in the editor
5. Verify all 25+ tables were created successfully

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NODE_ENV=development
```

To find your Supabase credentials:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** → `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys** → `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 5. Seed the Database

Populate your database with sample data:

```bash
npm run db:seed
```

This creates:
- Business settings with default configuration
- 3 sample team members
- 3 sample subcontractors
- 24 room prices
- 8 exterior prices
- 10 add-ons
- 3 sample leads
- VTO data
- 3 quarterly rocks
- 5 scorecard metrics

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Create Your First User

1. Click **"Sign up"** on the login page
2. Enter your name, email, and password
3. Click **"Create account"**
4. You'll be automatically logged in

## Project Structure

```
paint-pro-os/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/               # API routes (44 endpoints)
│   │   │   ├── auth/          # Authentication
│   │   │   ├── leads/         # Lead management
│   │   │   ├── estimates/     # Estimate creation
│   │   │   ├── jobs/          # Job tracking
│   │   │   ├── team/          # Team management
│   │   │   ├── subcontractors/# Subcontractor management
│   │   │   ├── price-book/    # Pricing management
│   │   │   ├── settings/      # Business settings
│   │   │   ├── traction/      # EOS/Traction tools
│   │   │   ├── dashboard/     # KPI analytics
│   │   │   └── ai/            # AI chat
│   │   ├── dashboard/         # Main dashboard page
│   │   ├── leads/             # Leads management UI
│   │   ├── estimates/         # Estimates UI
│   │   ├── jobs/              # Jobs UI
│   │   ├── traction/          # EOS tools UI
│   │   └── register/          # User registration
│   ├── components/            # React components
│   ├── lib/                   # Utility libraries
│   │   ├── supabase.ts       # Supabase client
│   │   ├── auth.ts           # Authentication helpers
│   │   └── api.ts            # API client wrappers
│   ├── types/                 # TypeScript types
│   │   └── database.ts       # Database model types
│   └── middleware.ts          # Authentication middleware
├── scripts/
│   └── seed-supabase.ts      # Database seeding script
├── supabase_schema.sql       # Database schema (588 lines)
└── public/                    # Static assets
```

## API Routes

All 44 API endpoints are documented and working:

### Authentication (4 endpoints)
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Business Management (15 endpoints)
- `/api/leads` - Lead CRUD operations
- `/api/estimates` - Estimate CRUD with line items
- `/api/jobs` - Job CRUD with financials
- `/api/team` - Team member management
- `/api/subcontractors` - Subcontractor management

### Configuration (10 endpoints)
- `/api/price-book/*` - Room, exterior, and addon pricing
- `/api/settings/*` - Business, estimate, and portfolio settings

### EOS/Traction (14 endpoints)
- `/api/traction/vto` - Vision/Traction Organizer
- `/api/traction/rocks` - Quarterly goals
- `/api/traction/scorecard` - Performance metrics
- `/api/traction/todos` - Task management
- `/api/traction/issues` - Issue tracking
- `/api/traction/meetings` - Meeting management
- `/api/traction/seats` - Accountability chart
- `/api/traction/people-analyzer` - People evaluation

### Analytics (2 endpoints)
- `/api/dashboard` - Business KPIs and metrics
- `/api/ai/chat` - AI assistant with business context

## Database Schema

The application uses 25+ PostgreSQL tables:

**Core Business:**
- User, Session, BusinessSettings
- Lead, Estimate, EstimateLineItem, EstimateSignature
- Job, TeamMember, Subcontractor

**Pricing:**
- RoomPrice, ExteriorPrice, Addon
- CompanyEstimateSettings, PortfolioImage

**EOS/Traction:**
- VTO, Rock, Todo, Issue, Meeting
- ScorecardMetric, ScorecardEntry
- Seat, PeopleAnalyzer

**AI:**
- AIConversation, AIMessage

Full schema available in `supabase_schema.sql`

## Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:seed      # Seed database with sample data

# Linting
npm run lint         # Run ESLint
```

## Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) | `eyJhbG...` |
| `NODE_ENV` | Environment mode | `development` or `production` |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

Vercel will automatically:
- Build your Next.js application
- Set up serverless functions for API routes
- Configure domain and SSL

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify
- Docker container

Make sure to:
1. Set all environment variables
2. Run `npm run build` successfully
3. Configure the start command as `npm run start`

## Migration from Prisma

This project was successfully migrated from Prisma ORM to Supabase. Migration documentation:

- **[MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md)** - Complete migration report
- **[MIGRATION_STATUS.md](MIGRATION_STATUS.md)** - Status tracking
- **[SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md)** - Setup instructions

**Migration Stats:**
- ✅ 44/44 API routes migrated (100%)
- ✅ 25+ database tables
- ✅ Complete type safety maintained
- ✅ Zero Prisma dependencies
- ✅ Production build verified

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/localxcrm/paint-pro-os/issues)
- Check the migration documentation
- Review the Supabase setup guide

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Database powered by [Supabase](https://supabase.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- EOS/Traction methodology by Gino Wickman

---

**Status:** Production Ready ✅
**Version:** 1.0.0
**Last Updated:** December 15, 2024

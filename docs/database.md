# PaintFlow Database Documentation

This document describes the database architecture for PaintFlow, a multi-tenant SaaS business management system for painting companies.

## Overview

- **Database**: PostgreSQL via Supabase
- **Schema**: `public`
- **Total Tables**: 50+
- **Multi-tenancy**: Organization-based isolation
- **Authentication**: Custom session-based (not Supabase Auth)

---

## Multi-Tenancy Model

PaintFlow uses an **organization-based multi-tenancy** model:

```
Organization (tenant)
    ├── Users (via UserOrganization join table)
    ├── TeamMembers
    ├── Subcontractors
    ├── Leads → Estimates → Jobs → WorkOrders
    ├── BusinessSettings
    └── All other data...
```

### Key Concepts

1. **Organizations** are the top-level tenant
2. **Users** can belong to multiple organizations via `UserOrganization`
3. **All data queries** filter by `organizationId`
4. **Organization ID** is stored in `paintpro_org_id` cookie

### Tables WITHOUT organizationId (by design)

| Table | Reason |
|-------|--------|
| `Organization` | IS the organization table |
| `User` | Users belong to orgs via `UserOrganization` |
| `PasswordReset` | Linked to User, not org-specific |
| `AIMessage` | Linked to `AIConversation` which has organizationId |
| `ChatMessage` | Linked to `Chat` which has organizationId |
| `EstimateLineItem` | Linked to `Estimate` which has organizationId |
| `EstimateSignature` | Linked to `Estimate` which has organizationId |
| `ScorecardEntry` | Linked to `ScorecardMetric` which has organizationId |

---

## Authentication Model

PaintFlow uses **custom session-based authentication** (not Supabase Auth):

### Admin Users
- Session token stored in `paintpro_session` cookie
- Sessions validated against `Session` table
- Session includes `userId` and `organizationId`

### Subcontractors
- Separate auth with `paintpro_sub_session` cookie
- Access limited to their assigned work orders

### GHL SSO
- Single sign-on integration for GoHighLevel users
- Links via `ghlUserId` and `ghlLocationId` on User table
- GHL locations mapped to organizations via `GhlLocation` table

---

## Core Tables

### Identity & Access

```sql
User
├── id (PK)
├── email (unique)
├── passwordHash
├── name
├── role ('admin' | 'user' | 'viewer')
├── ghlUserId (nullable, for GHL SSO)
├── ghlLocationId (nullable, for GHL SSO)
└── timestamps

Organization
├── id (PK)
├── name
├── slug (unique)
├── plan ('free' | 'pro' | 'enterprise')
├── settings (JSON)
└── timestamps

UserOrganization (join table)
├── id (PK)
├── userId (FK → User)
├── organizationId (FK → Organization)
├── role ('owner' | 'admin' | 'member')
└── isDefault (boolean)

Session
├── id (PK)
├── token (unique)
├── userId (FK → User)
├── organizationId (FK → Organization)
├── expiresAt
└── timestamps
```

### Sales Pipeline

```sql
Lead
├── id (PK)
├── organizationId (FK)
├── firstName, lastName
├── email, phone, address
├── source (marketing channel)
├── status ('new' | 'contacted' | 'estimate_scheduled' | 'estimated' | 'proposal_sent' | 'follow_up' | 'won' | 'lost')
├── projectType ('interior' | 'exterior' | 'both')
├── assignedToId (FK → TeamMember)
└── timestamps

Estimate
├── id (PK)
├── organizationId (FK)
├── estimateNumber (unique per org)
├── leadId (FK → Lead, nullable)
├── clientName, address
├── status ('draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired')
├── subtotal, discountAmount, totalPrice
├── grossProfit, grossMarginPct
├── meetsMinGp, meetsTargetGm (calculated flags)
└── timestamps

EstimateLineItem
├── id (PK)
├── estimateId (FK → Estimate)
├── description, location, scope
├── quantity, unitPrice, lineTotal
└── sortOrder

EstimateSignature
├── id (PK)
├── estimateId (FK → Estimate)
├── clientName
├── signatureDataUrl (base64)
├── signedAt
└── ipAddress
```

### Job Management

```sql
Job
├── id (PK)
├── organizationId (FK)
├── jobNumber (unique per org)
├── leadId (FK → Lead, nullable)
├── estimateId (FK → Estimate, nullable)
├── clientName, address, city, state, zipCode
├── latitude, longitude (for mapping)
├── projectType, status
├── jobDate, scheduledStartDate, scheduledEndDate
├── actualStartDate, actualEndDate
│
├── -- Financial Fields --
├── jobValue
├── subMaterials (15% of jobValue)
├── subLabor (45% of jobValue)
├── subTotal (60% of jobValue)
├── grossProfit (40% of jobValue)
├── grossMarginPct
├── depositRequired (30% of jobValue)
├── balanceDue
│
├── -- Payment Tracking --
├── depositPaid, depositPaymentMethod, depositPaymentDate
├── jobPaid, jobPaymentMethod, jobPaymentDate
├── invoiceDate, paymentReceivedDate, daysToCollect
│
├── -- Team Assignments --
├── salesRepId (FK → TeamMember)
├── salesCommissionPct, salesCommissionAmount, salesCommissionPaid
├── projectManagerId (FK → TeamMember)
├── pmCommissionPct, pmCommissionAmount, pmCommissionPaid
├── subcontractorId (FK → Subcontractor)
├── subcontractorPrice, subcontractorPaid
│
├── -- Profit Analysis --
├── meetsMinGp (boolean, >= $900)
├── meetsTargetGm (boolean, >= 40%)
├── profitFlag ('OK' | 'RAISE_PRICE' | 'FIX_SCOPE')
│
├── notes
├── photos (JSON array)
├── paymentHistory (JSON array)
└── timestamps

WorkOrder
├── id (PK)
├── organizationId (FK)
├── jobId (FK → Job)
├── osNumber (unique)
├── publicToken (unique, for public access)
├── status ('pending' | 'in_progress' | 'completed' | 'cancelled')
├── scheduledDate, estimatedDuration
├── actualStartDate, actualEndDate
├── subcontractorPrice
├── rooms (JSON), tasks (JSON), materials (JSON)
├── photos (JSON), comments (JSON)
└── timestamps
```

### Team & Subcontractors

```sql
TeamMember
├── id (PK)
├── organizationId (FK)
├── name, email, phone
├── role ('sales' | 'pm' | 'both')
├── defaultCommissionPct
├── isActive
├── avatar, color
└── timestamps

Subcontractor
├── id (PK)
├── organizationId (FK)
├── userId (FK → User, nullable, for portal access)
├── name, companyName, email, phone
├── specialty ('interior' | 'exterior' | 'both')
├── defaultPayoutPct
├── isActive
├── color, calendarToken
└── timestamps
```

### Pricing Configuration

```sql
RoomPrice
├── id (PK)
├── organizationId (FK)
├── roomType, size
├── typicalSqft
├── wallsOnly, wallsTrim, wallsTrimCeiling, fullRefresh (prices)
└── timestamps

ExteriorPrice
├── id (PK)
├── organizationId (FK)
├── surfaceType
├── pricePerSqft
├── prepMultiplier
└── timestamps

Addon
├── id (PK)
├── organizationId (FK)
├── name, category, description
├── unit, basePrice
└── timestamps
```

### EOS/Traction Tables

```sql
VTO (Vision/Traction Organizer)
├── id (PK)
├── organizationId (FK, unique)
├── coreValues (JSON)
├── coreFocus (JSON)
├── tenYearTarget
├── threeYearPicture (JSON)
├── oneYearGoals (JSON)
├── quarterlyRocks (JSON)
└── timestamps

Rock (Quarterly Goals)
├── id (PK)
├── organizationId (FK)
├── title, description
├── owner
├── rockType ('company' | 'individual')
├── quarter, year
├── status ('on_track' | 'off_track' | 'complete' | 'dropped')
├── dueDate
├── milestones (JSON)
└── timestamps

Todo
├── id (PK)
├── organizationId (FK)
├── title, owner
├── dueDate
├── status ('pending' | 'done')
├── rockId (FK → Rock, nullable)
└── timestamps

Issue
├── id (PK)
├── organizationId (FK)
├── title, description
├── issueType ('short_term' | 'long_term')
├── priority
├── status ('open' | 'in_discussion' | 'solved')
├── createdBy, resolution
└── timestamps

ScorecardMetric
├── id (PK)
├── organizationId (FK)
├── name, description, owner
├── goalValue, goalType, goalDirection
├── category ('leading' | 'lagging')
├── isActive, sortOrder
└── timestamps

ScorecardEntry
├── id (PK)
├── metricId (FK → ScorecardMetric)
├── weekEndingDate
├── actualValue
├── onTrack (boolean)
├── notes
└── timestamps
```

### Chat System

```sql
Chat
├── id (PK)
├── organizationId (FK)
├── workOrderId (FK → WorkOrder, unique)
├── subcontractorId (FK → Subcontractor, nullable)
├── lastMessageAt, lastMessagePreview
├── unreadCountCompany, unreadCountSubcontractor
└── timestamps

ChatMessage
├── id (PK)
├── chatId (FK → Chat)
├── authorId (FK → User, nullable)
├── authorName, authorType
├── type ('text' | 'image' | 'audio' | 'video')
├── text
├── mediaUrl, mediaPath, mediaThumbnail, mediaDuration
├── isRead
└── createdAt
```

---

## Indexes

### Primary Indexes (automatically created)
- All primary keys have unique indexes
- All unique constraints have unique indexes

### Foreign Key Indexes
All foreign key columns are indexed for join performance:

```sql
-- Examples
idx_job_organizationid ON Job(organizationId)
idx_job_salesrepid ON Job(salesRepId)
idx_job_projectmanagerid ON Job(projectManagerId)
idx_job_subcontractorid ON Job(subcontractorId)
idx_estimate_leadid ON Estimate(leadId)
idx_workorder_jobid ON WorkOrder(jobId)
-- ... and more
```

### Composite Indexes
```sql
idx_job_org_status_date ON Job(organizationId, status, jobDate)
idx_lead_org_status ON Lead(organizationId, status)
idx_rock_org_status ON Rock(organizationId, status)
```

---

## Row Level Security (RLS)

### Tables with RLS Enabled

Most tables use the service role key for access (custom auth), but some tables have RLS for additional security:

| Table | Policy | Description |
|-------|--------|-------------|
| areas | `(select auth.uid()) = user_id` | User-private data |
| goals | `(select auth.uid()) = user_id` | User-private data |
| focus_items | `(select auth.uid()) = user_id` | User-private data |
| reviews | `(select auth.uid()) = user_id` | User-private data |
| chat_messages | `(select auth.uid()) = user_id` | User-private data |
| coach_actions | `(select auth.uid()) = user_id` | User-private data |

### Tables without RLS (use service role)
Core application tables like `User`, `Organization`, `Session`, `Job`, `Estimate`, etc. use the service role key and filter by `organizationId` in application code.

---

## Database Functions

```sql
-- Get current organization ID from session context
get_current_org_id() RETURNS uuid

-- Update chat last message timestamp (trigger function)
update_chat_last_message() RETURNS trigger

-- Set updated_at timestamp (trigger function)
set_updated_at() RETURNS trigger
```

---

## TypeScript Types

Auto-generated types are available in:
- `src/types/supabase.types.ts` - Auto-generated from database schema
- `src/types/database.ts` - Manual types with enums and relations

### Usage Example

```typescript
import { Database } from '@/types/supabase.types';

type Job = Database['public']['Tables']['Job']['Row'];
type JobInsert = Database['public']['Tables']['Job']['Insert'];
type JobUpdate = Database['public']['Tables']['Job']['Update'];
```

---

## Migrations

Migrations are stored in `supabase/migrations/` and applied via Supabase MCP.

### Recent Migrations
```
20241227100000 - create_chat_tables
20241227100001 - migrate_comments_to_chat
20241227100002 - enable_realtime_chatmessage
20241227100003 - add_ghl_sso
20241227100004 - add_password_reset
20260114234326 - add_missing_indexes
20260114235247 - fix_duplicate_indexes
20260114235315 - add_fk_indexes
20260114235351 - fix_function_search_path
20260114235428 - add_job_subcontractorid_index
20260115000346 - fix_rls_policy_performance
20260115001XXX - remove_duplicate_unique_indexes
20260115001XXX - fix_workorder_status_type
```

---

## Querying Patterns

### Server-side (API Routes)

```typescript
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const orgId = getOrganizationIdFromRequest(request);
  if (!orgId) return NextResponse.json({ error: 'No org' }, { status: 400 });

  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('Job')
    .select('*, salesRep:TeamMember!salesRepId(*), projectManager:TeamMember!projectManagerId(*)')
    .eq('organizationId', orgId)
    .order('jobDate', { ascending: false });

  return NextResponse.json(data);
}
```

### Client-side

```typescript
import { getSupabaseClient } from '@/lib/supabase';

const supabase = getSupabaseClient(); // Singleton

const { data } = await supabase
  .from('Job')
  .select('*')
  .eq('organizationId', orgId);
```

---

## Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│ Organization │────<│ UserOrganization │>────│     User     │
└──────────────┘     └──────────────────┘     └──────────────┘
       │                                              │
       │ 1:N                                         │ 1:N
       ▼                                              ▼
┌──────────────┐     ┌──────────────┐         ┌──────────────┐
│  TeamMember  │     │    Lead      │         │   Session    │
└──────────────┘     └──────────────┘         └──────────────┘
       │                    │
       │                    │ 1:N
       │                    ▼
       │             ┌──────────────┐
       │             │   Estimate   │────────────┐
       │             └──────────────┘            │
       │                    │                    │ 1:N
       │                    │ 1:1                ▼
       │                    ▼          ┌──────────────────┐
       │             ┌──────────────┐  │ EstimateLineItem │
       └────────────>│     Job      │  └──────────────────┘
                     └──────────────┘
                            │
                            │ 1:N
                            ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  WorkOrder   │────>│     Chat     │
                     └──────────────┘     └──────────────┘
                                                 │
                                                 │ 1:N
                                                 ▼
                                          ┌──────────────┐
                                          │ ChatMessage  │
                                          └──────────────┘
```

---

## Best Practices

1. **Always filter by organizationId** in queries
2. **Use the service role key** only on the server
3. **Validate session** before any data access
4. **Use transactions** for related inserts/updates
5. **Index foreign keys** for join performance
6. **Keep types in sync** by regenerating from schema

---

## Regenerating Types

To regenerate TypeScript types from the database schema:

```bash
# Using Supabase MCP
mcp__supabase__generate_typescript_types

# Save output to src/types/supabase.types.ts
```

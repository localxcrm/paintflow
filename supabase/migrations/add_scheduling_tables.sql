-- Add Scheduling Tables for Crew Management
-- Run: supabase db push

-- Schedule entry for a job (when the job is scheduled)
CREATE TABLE IF NOT EXISTS "JobSchedule" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "jobId" UUID NOT NULL REFERENCES "Job"(id) ON DELETE CASCADE,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "scheduledDate" DATE NOT NULL,
  "startTime" TIME,
  "endTime" TIME,
  "estimatedHours" DECIMAL(5,2),
  notes TEXT,
  "createdBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assign subcontractors to specific schedule dates
CREATE TABLE IF NOT EXISTS "JobAssignment" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "jobScheduleId" UUID NOT NULL REFERENCES "JobSchedule"(id) ON DELETE CASCADE,
  "subcontractorId" UUID NOT NULL REFERENCES "Subcontractor"(id) ON DELETE CASCADE,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "confirmedAt" TIMESTAMP WITH TIME ZONE,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("jobScheduleId", "subcontractorId")
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_job_schedule_date ON "JobSchedule"("organizationId", "scheduledDate");
CREATE INDEX IF NOT EXISTS idx_job_schedule_job ON "JobSchedule"("jobId");
CREATE INDEX IF NOT EXISTS idx_job_assignment_sub ON "JobAssignment"("subcontractorId", "organizationId");
CREATE INDEX IF NOT EXISTS idx_job_assignment_schedule ON "JobAssignment"("jobScheduleId");

-- RLS policies
ALTER TABLE "JobSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JobAssignment" ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users in their org
CREATE POLICY "Users can manage own org schedules" ON "JobSchedule"
  FOR ALL
  USING ("organizationId" IS NOT NULL)
  WITH CHECK ("organizationId" IS NOT NULL);

CREATE POLICY "Users can manage own org assignments" ON "JobAssignment"
  FOR ALL
  USING ("organizationId" IS NOT NULL)
  WITH CHECK ("organizationId" IS NOT NULL);

-- View for calendar with all related data
CREATE OR REPLACE VIEW "CalendarView" AS
SELECT 
  js.id as "scheduleId",
  js."scheduledDate",
  js."startTime",
  js."endTime",
  js."estimatedHours",
  js.notes as "scheduleNotes",
  j.id as "jobId",
  j."jobNumber",
  j."clientName",
  j.address,
  j.status as "jobStatus",
  j."projectType",
  ja.id as "assignmentId",
  ja."subcontractorId",
  ja.status as "assignmentStatus",
  s.name as "subcontractorName",
  s.color as "subcontractorColor",
  js."organizationId"
FROM "JobSchedule" js
JOIN "Job" j ON js."jobId" = j.id
LEFT JOIN "JobAssignment" ja ON ja."jobScheduleId" = js.id
LEFT JOIN "Subcontractor" s ON ja."subcontractorId" = s.id;

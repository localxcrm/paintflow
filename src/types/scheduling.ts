// Scheduling Types
// Types for crew scheduling and calendar views

// ============================================
// DATABASE MODELS
// ============================================

export type AssignmentStatus = 'assigned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

/** Job schedule entry */
export interface JobSchedule {
  id: string;
  jobId: string;
  organizationId: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string | null; // HH:MM
  endTime: string | null; // HH:MM
  estimatedHours: number | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Subcontractor assignment to a scheduled job */
export interface JobAssignment {
  id: string;
  jobScheduleId: string;
  subcontractorId: string;
  organizationId: string;
  status: AssignmentStatus;
  assignedAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API TYPES
// ============================================

/** Calendar event for display */
export interface CalendarEvent {
  scheduleId: string;
  scheduledDate: string;
  startTime: string | null;
  endTime: string | null;
  estimatedHours: number | null;
  scheduleNotes: string | null;
  jobId: string;
  jobNumber: string;
  clientName: string;
  address: string;
  jobStatus: string;
  projectType: string;
  assignments: CalendarAssignment[];
}

/** Assignment info for calendar display */
export interface CalendarAssignment {
  assignmentId: string;
  subcontractorId: string;
  subcontractorName: string;
  subcontractorColor: string;
  status: AssignmentStatus;
}

/** Calendar view data for a date range */
export interface CalendarData {
  startDate: string;
  endDate: string;
  events: CalendarEvent[];
  subcontractors: SubcontractorAvailability[];
}

/** Subcontractor availability/schedule */
export interface SubcontractorAvailability {
  id: string;
  name: string;
  color: string;
  scheduledDates: string[]; // Dates where sub is already scheduled
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/** Create schedule request */
export interface CreateScheduleRequest {
  jobId: string;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  estimatedHours?: number;
  notes?: string;
  subcontractorIds?: string[];
}

/** Update schedule request */
export interface UpdateScheduleRequest {
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  estimatedHours?: number;
  notes?: string;
}

/** Create assignment request */
export interface CreateAssignmentRequest {
  jobScheduleId: string;
  subcontractorId: string;
  notes?: string;
}

/** Update assignment request */
export interface UpdateAssignmentRequest {
  status?: AssignmentStatus;
  notes?: string;
}

/** Schedule conflict check */
export interface ConflictCheck {
  subcontractorId: string;
  date: string;
}

/** Conflict check result */
export interface ConflictResult {
  hasConflict: boolean;
  conflictingJobs: {
    jobId: string;
    jobNumber: string;
    clientName: string;
    startTime: string | null;
    endTime: string | null;
  }[];
}

// ============================================
// CALENDAR VIEW TYPES
// ============================================

export type CalendarViewType = 'month' | 'week' | 'day';

/** Calendar navigation state */
export interface CalendarState {
  viewType: CalendarViewType;
  currentDate: Date;
  selectedDate: Date | null;
}

/** Calendar cell data */
export interface CalendarDayData {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}

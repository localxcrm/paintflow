// Schedules API client functions
import { api } from './client';
import type { 
  CalendarEvent, 
  CalendarData,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  JobSchedule,
  ConflictCheck,
  ConflictResult,
} from '@/types/scheduling';

interface SchedulesResponse {
  events: CalendarEvent[];
}

interface CreateScheduleResponse {
  schedule: JobSchedule;
  success: boolean;
}

/**
 * Fetch calendar events for date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 */
export async function fetchSchedules(startDate: string, endDate: string) {
  return api.get<SchedulesResponse>(`/schedules?startDate=${startDate}&endDate=${endDate}`);
}

/**
 * Create a new schedule
 */
export async function createSchedule(data: CreateScheduleRequest) {
  return api.post<CreateScheduleResponse>('/schedules', data);
}

/**
 * Update an existing schedule
 * @param scheduleId - Schedule ID
 * @param data - Update data
 */
export async function updateSchedule(scheduleId: string, data: UpdateScheduleRequest) {
  return api.patch<JobSchedule>(`/schedules/${scheduleId}`, data);
}

/**
 * Delete a schedule
 * @param scheduleId - Schedule ID
 */
export async function deleteSchedule(scheduleId: string) {
  return api.delete(`/schedules/${scheduleId}`);
}

/**
 * Check for scheduling conflicts
 * @param check - Conflict check params
 */
export async function checkConflicts(check: ConflictCheck) {
  return api.post<ConflictResult>('/schedules/conflicts', check);
}

/**
 * Assign a subcontractor to a schedule
 * @param scheduleId - Schedule ID
 * @param subcontractorId - Subcontractor ID
 */
export async function assignSubcontractor(scheduleId: string, subcontractorId: string) {
  return api.post<{ success: boolean }>(`/schedules/${scheduleId}/assign`, { subcontractorId });
}

/**
 * Remove a subcontractor from a schedule
 * @param assignmentId - Assignment ID
 */
export async function removeAssignment(assignmentId: string) {
  return api.delete(`/schedules/assignments/${assignmentId}`);
}

/**
 * Schedules API object following existing API pattern
 */
export const schedulesApi = {
  /**
   * Get calendar events for date range
   */
  async getSchedules(startDate: string, endDate: string) {
    return fetchSchedules(startDate, endDate);
  },

  /**
   * Create a new schedule
   */
  async create(data: CreateScheduleRequest) {
    return createSchedule(data);
  },

  /**
   * Update a schedule
   */
  async update(scheduleId: string, data: UpdateScheduleRequest) {
    return updateSchedule(scheduleId, data);
  },

  /**
   * Delete a schedule
   */
  async delete(scheduleId: string) {
    return deleteSchedule(scheduleId);
  },

  /**
   * Check for conflicts
   */
  async checkConflicts(check: ConflictCheck) {
    return checkConflicts(check);
  },

  /**
   * Assign subcontractor
   */
  async assign(scheduleId: string, subcontractorId: string) {
    return assignSubcontractor(scheduleId, subcontractorId);
  },

  /**
   * Remove assignment
   */
  async unassign(assignmentId: string) {
    return removeAssignment(assignmentId);
  },
};

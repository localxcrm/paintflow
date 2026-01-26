import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import type { CalendarEvent, CalendarAssignment, CreateScheduleRequest } from '@/types/scheduling';

// GET /api/schedules - Get calendar events for date range
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const orgId = getOrganizationIdFromRequest(request);
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Fetch schedules with job and assignment data
    let query = supabase
      .from('JobSchedule')
      .select(`
        id,
        scheduledDate,
        startTime,
        endTime,
        estimatedHours,
        notes,
        Job!inner (
          id,
          jobNumber,
          clientName,
          address,
          status,
          projectType
        ),
        JobAssignment (
          id,
          subcontractorId,
          status,
          Subcontractor (
            id,
            name,
            color
          )
        )
      `)
      .gte('scheduledDate', startDate)
      .lte('scheduledDate', endDate)
      .order('scheduledDate', { ascending: true })
      .order('startTime', { ascending: true });

    if (orgId) {
      query = query.eq('organizationId', orgId);
    }

    const { data: schedules, error } = await query;

    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      );
    }

    // Transform to CalendarEvent format
    const events: CalendarEvent[] = (schedules || []).map((schedule: any) => ({
      scheduleId: schedule.id,
      scheduledDate: schedule.scheduledDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      estimatedHours: schedule.estimatedHours,
      scheduleNotes: schedule.notes,
      jobId: schedule.Job.id,
      jobNumber: schedule.Job.jobNumber,
      clientName: schedule.Job.clientName,
      address: schedule.Job.address,
      jobStatus: schedule.Job.status,
      projectType: schedule.Job.projectType,
      assignments: (schedule.JobAssignment || []).map((assignment: any) => ({
        assignmentId: assignment.id,
        subcontractorId: assignment.subcontractorId,
        subcontractorName: assignment.Subcontractor?.name || 'Unknown',
        subcontractorColor: assignment.Subcontractor?.color || '#3b82f6',
        status: assignment.status,
      })),
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in schedules endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/schedules - Create a new schedule
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const orgId = getOrganizationIdFromRequest(request);
    const body = await request.json() as CreateScheduleRequest;

    if (!body.jobId || !body.scheduledDate) {
      return NextResponse.json(
        { error: 'jobId and scheduledDate are required' },
        { status: 400 }
      );
    }

    // Create the schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('JobSchedule')
      .insert({
        jobId: body.jobId,
        organizationId: orgId,
        scheduledDate: body.scheduledDate,
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        estimatedHours: body.estimatedHours || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('Error creating schedule:', scheduleError);
      return NextResponse.json(
        { error: 'Failed to create schedule' },
        { status: 500 }
      );
    }

    // Create assignments if subcontractors provided
    if (body.subcontractorIds && body.subcontractorIds.length > 0) {
      const assignments = body.subcontractorIds.map((subId) => ({
        jobScheduleId: schedule.id,
        subcontractorId: subId,
        organizationId: orgId,
        status: 'assigned',
      }));

      const { error: assignmentError } = await supabase
        .from('JobAssignment')
        .insert(assignments);

      if (assignmentError) {
        console.error('Error creating assignments:', assignmentError);
        // Schedule created but assignments failed - not a critical error
      }
    }

    // Update job's scheduledStartDate if not already set
    await supabase
      .from('Job')
      .update({
        scheduledStartDate: body.scheduledDate,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', body.jobId)
      .is('scheduledStartDate', null);

    return NextResponse.json({ schedule, success: true });
  } catch (error) {
    console.error('Error in schedules endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

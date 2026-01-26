import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// GET /api/sub/schedule - Get subcontractor's schedule
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Get sub ID from session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('sub_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subcontractor from session
    const { data: session } = await supabase
      .from('SubcontractorSession')
      .select('subcontractorId')
      .eq('token', sessionToken)
      .gt('expiresAt', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const subId = session.subcontractorId;

    // Get date range from params (default to next 30 days)
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    })();

    // Fetch assignments for this sub
    const { data: assignments, error } = await supabase
      .from('JobAssignment')
      .select(`
        id,
        status,
        notes,
        JobSchedule!inner (
          id,
          scheduledDate,
          startTime,
          endTime,
          estimatedHours,
          Job!inner (
            id,
            jobNumber,
            clientName,
            address,
            city,
            projectType,
            status
          )
        )
      `)
      .eq('subcontractorId', subId)
      .gte('JobSchedule.scheduledDate', startDate)
      .lte('JobSchedule.scheduledDate', endDate)
      .order('JobSchedule(scheduledDate)', { ascending: true });

    if (error) {
      console.error('Error fetching sub schedule:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schedule' },
        { status: 500 }
      );
    }

    // Transform to friendly format
    const schedule = (assignments || []).map((a: any) => ({
      assignmentId: a.id,
      assignmentStatus: a.status,
      notes: a.notes,
      scheduledDate: a.JobSchedule.scheduledDate,
      startTime: a.JobSchedule.startTime,
      endTime: a.JobSchedule.endTime,
      estimatedHours: a.JobSchedule.estimatedHours,
      job: {
        id: a.JobSchedule.Job.id,
        jobNumber: a.JobSchedule.Job.jobNumber,
        clientName: a.JobSchedule.Job.clientName,
        address: a.JobSchedule.Job.address,
        city: a.JobSchedule.Job.city,
        projectType: a.JobSchedule.Job.projectType,
        status: a.JobSchedule.Job.status,
      },
    }));

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error in sub schedule endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

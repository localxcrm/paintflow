import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

const SUB_SESSION_COOKIE = 'paintpro_sub_session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SUB_SESSION_COOKIE)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get session with user
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('*, User(*)')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401 }
      );
    }

    // Get subcontractor linked to this user
    const { data: subcontractor, error: subError } = await supabase
      .from('Subcontractor')
      .select('id, organizationId')
      .eq('userId', session.userId)
      .single();

    if (subError || !subcontractor) {
      return NextResponse.json(
        { error: 'Subcontratado não encontrado' },
        { status: 404 }
      );
    }

    // Get jobs assigned to this subcontractor
    const { data: jobs, error: jobsError } = await supabase
      .from('Job')
      .select(`
        id,
        jobNumber,
        clientName,
        address,
        city,
        status,
        scheduledStartDate,
        scheduledEndDate,
        subcontractorPrice,
        WorkOrder (
          id,
          osNumber,
          status,
          rooms,
          tasks,
          publicToken
        )
      `)
      .eq('subcontractorId', subcontractor.id)
      .in('status', ['scheduled', 'got_the_job'])
      .order('scheduledStartDate', { ascending: true });

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json(
        { error: 'Erro ao buscar trabalhos' },
        { status: 500 }
      );
    }

    // Calculate progress for each job
    const jobsWithProgress = (jobs || []).map(job => {
      const workOrder = job.WorkOrder?.[0];
      let progress = 0;

      if (workOrder?.tasks) {
        const tasks = workOrder.tasks as { completed?: boolean }[];
        const completedTasks = tasks.filter(t => t.completed).length;
        progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
      }

      return {
        ...job,
        workOrder: workOrder || null,
        progress,
      };
    });

    return NextResponse.json({ jobs: jobsWithProgress });
  } catch (error) {
    console.error('Error in sub jobs route:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}

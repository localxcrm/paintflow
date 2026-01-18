import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

const SUB_SESSION_COOKIE = 'paintpro_sub_session';

// Helper to get subcontractor's organization ID
async function getSubOrganizationId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SUB_SESSION_COOKIE)?.value;

    if (!sessionToken) return null;

    const supabase = createServerSupabaseClient();

    // Get session with user
    const { data: session } = await supabase
      .from('Session')
      .select('*, User(*)')
      .eq('token', sessionToken)
      .single();

    if (!session?.User) return null;

    // Get subcontractor's organization
    const { data: subcontractor } = await supabase
      .from('Subcontractor')
      .select('organizationId')
      .eq('userId', session.User.id)
      .single();

    return subcontractor?.organizationId || null;
  } catch {
    return null;
  }
}

// GET /api/sub/training/courses - Get all published courses for subcontractor
export async function GET(request: Request) {
  try {
    const organizationId = await getSubOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Fetch courses that are published and for subcontractors
    let query = supabase
      .from('TrainingCourse')
      .select('*')
      .eq('organizationId', organizationId)
      .eq('isPublished', true)
      .in('targetAudience', ['subcontractor', 'both']);

    // Filter by courseType if specified
    if (type === 'sop' || type === 'training') {
      query = query.eq('courseType', type);
    }

    const { data: courses, error } = await query
      .order('order', { ascending: true })
      .order('createdAt', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ courses: [] });
      }
      throw error;
    }

    // Get module counts for each course (only published modules)
    const coursesWithCounts = await Promise.all(
      (courses || []).map(async (course: any) => {
        const { count } = await supabase
          .from('SubcontractorTraining')
          .select('*', { count: 'exact', head: true })
          .eq('courseId', course.id)
          .eq('organizationId', organizationId)
          .eq('isPublished', true);

        return { ...course, moduleCount: count || 0 };
      })
    );

    return NextResponse.json({ courses: coursesWithCounts });
  } catch (error) {
    console.error('Error fetching courses for subcontractor:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cursos' },
      { status: 500 }
    );
  }
}

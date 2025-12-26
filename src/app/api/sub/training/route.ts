import { NextRequest, NextResponse } from 'next/server';
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

// GET /api/sub/training - Get all published training modules for subcontractor
// Supports ?id=xxx to get a single module
export async function GET(request: NextRequest) {
  try {
    const organizationId = await getSubOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const courseId = searchParams.get('courseId');

    // If ID is provided, fetch single module
    if (id) {
      const { data: module, error } = await supabase
        .from('SubcontractorTraining')
        .select('*')
        .eq('id', id)
        .eq('organizationId', organizationId)
        .eq('isPublished', true) // Only published modules
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Modulo nao encontrado' }, { status: 404 });
        }
        throw error;
      }

      return NextResponse.json(module);
    }

    // Otherwise, fetch all published modules
    let query = supabase
      .from('SubcontractorTraining')
      .select('id, title, category, order, createdAt, updatedAt')
      .eq('organizationId', organizationId)
      .eq('isPublished', true) // Only published modules
      .order('order', { ascending: true })
      .order('createdAt', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (courseId) {
      query = query.eq('courseId', courseId);
    }

    const { data: modules, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ modules: [] });
      }
      throw error;
    }

    return NextResponse.json({ modules: modules || [] });
  } catch (error) {
    console.error('Error fetching training modules:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar modulos de treinamento' },
      { status: 500 }
    );
  }
}

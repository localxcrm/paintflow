import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

// GET /api/sub-training - Get all training modules for organization (admin view)
// Also supports ?id=xxx to get a single module
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const courseId = searchParams.get('courseId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // If ID is provided, fetch single module
    if (id) {
      const { data: module, error } = await supabase
        .from('SubcontractorTraining')
        .select('*')
        .eq('id', id)
        .eq('organizationId', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }
        throw error;
      }

      return NextResponse.json(module);
    }

    // Otherwise, fetch all modules
    let query = supabase
      .from('SubcontractorTraining')
      .select('*')
      .eq('organizationId', organizationId)
      .order('order', { ascending: true })
      .order('createdAt', { ascending: false });

    if (courseId) {
      query = query.eq('courseId', courseId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
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
      { error: 'Failed to fetch training modules' },
      { status: 500 }
    );
  }
}

// POST /api/sub-training - Create a new training module
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Get the next order number
    const { data: lastModule } = await supabase
      .from('SubcontractorTraining')
      .select('order')
      .eq('organizationId', organizationId)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (lastModule?.order || 0) + 1;

    const { data: module, error } = await supabase
      .from('SubcontractorTraining')
      .insert({
        organizationId,
        title: body.title,
        category: body.category || 'producao',
        content: body.content || '',
        checklist: body.checklist || [],
        images: body.images || [],
        videoUrl: body.videoUrl || '',
        order: body.order ?? nextOrder,
        isPublished: body.isPublished ?? false,
        courseId: body.courseId || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(module, { status: 201 });
  } catch (error) {
    console.error('Error creating training module:', error);
    return NextResponse.json(
      { error: 'Failed to create training module' },
      { status: 500 }
    );
  }
}

// PUT /api/sub-training - Update a training module
export async function PUT(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Module ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.checklist !== undefined) updateData.checklist = body.checklist;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.courseId !== undefined) updateData.courseId = body.courseId;

    const { data: module, error } = await supabase
      .from('SubcontractorTraining')
      .update(updateData)
      .eq('id', body.id)
      .eq('organizationId', organizationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(module);
  } catch (error) {
    console.error('Error updating training module:', error);
    return NextResponse.json(
      { error: 'Failed to update training module' },
      { status: 500 }
    );
  }
}

// DELETE /api/sub-training - Delete a training module
export async function DELETE(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Module ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('SubcontractorTraining')
      .delete()
      .eq('id', id)
      .eq('organizationId', organizationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting training module:', error);
    return NextResponse.json(
      { error: 'Failed to delete training module' },
      { status: 500 }
    );
  }
}

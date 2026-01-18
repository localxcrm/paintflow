import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

export interface TrainingCourse {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  order: number;
  isPublished: boolean;
  targetAudience: 'admin' | 'subcontractor' | 'both';
  courseType: 'training' | 'sop';
  createdAt: string;
  updatedAt: string;
  moduleCount?: number;
}

// GET /api/sub-training/courses - Get all courses for organization
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // If ID is provided, fetch single course with module count
    if (id) {
      const { data: course, error } = await supabase
        .from('TrainingCourse')
        .select('*')
        .eq('id', id)
        .eq('organizationId', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }
        throw error;
      }

      // Get module count
      const { count } = await supabase
        .from('SubcontractorTraining')
        .select('*', { count: 'exact', head: true })
        .eq('courseId', id)
        .eq('organizationId', organizationId);

      return NextResponse.json({ ...course, moduleCount: count || 0 });
    }

    // Check for type filter
    const type = searchParams.get('type');

    // Fetch all courses
    let query = supabase
      .from('TrainingCourse')
      .select('*')
      .eq('organizationId', organizationId);

    // Filter by courseType if specified
    if (type === 'sop' || type === 'training') {
      query = query.eq('courseType', type);
    }

    const { data: courses, error } = await query
      .order('order', { ascending: true })
      .order('createdAt', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ courses: [] });
      }
      throw error;
    }

    // Get module counts for each course
    const coursesWithCounts = await Promise.all(
      (courses || []).map(async (course: any) => {
        const { count } = await supabase
          .from('SubcontractorTraining')
          .select('*', { count: 'exact', head: true })
          .eq('courseId', course.id)
          .eq('organizationId', organizationId);

        return { ...course, moduleCount: count || 0 };
      })
    );

    return NextResponse.json({ courses: coursesWithCounts });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/sub-training/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Get the next order number
    const { data: lastCourse } = await supabase
      .from('TrainingCourse')
      .select('order')
      .eq('organizationId', organizationId)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (lastCourse?.order || 0) + 1;

    const { data: course, error } = await supabase
      .from('TrainingCourse')
      .insert({
        organizationId,
        title: body.title,
        description: body.description || null,
        coverImage: body.coverImage || null,
        order: body.order ?? nextOrder,
        isPublished: body.isPublished ?? false,
        targetAudience: body.targetAudience || 'subcontractor',
        courseType: body.courseType || 'training',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

// PUT /api/sub-training/courses - Update a course
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
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.targetAudience !== undefined) updateData.targetAudience = body.targetAudience;
    if (body.courseType !== undefined) updateData.courseType = body.courseType;

    const { data: course, error } = await supabase
      .from('TrainingCourse')
      .update(updateData)
      .eq('id', body.id)
      .eq('organizationId', organizationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE /api/sub-training/courses - Delete a course
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
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('TrainingCourse')
      .delete()
      .eq('id', id)
      .eq('organizationId', organizationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}

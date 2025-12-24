import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

// GET /api/rocks - Get all rocks for organization
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get('quarter');
    const year = searchParams.get('year');
    const rockType = searchParams.get('type');

    let query = supabase
      .from('Rock')
      .select('*')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (quarter) {
      query = query.eq('quarter', parseInt(quarter));
    }

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    if (rockType) {
      query = query.eq('rockType', rockType);
    }

    const { data: rocks, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ rocks: rocks || [] });
  } catch (error) {
    console.error('Error fetching rocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rocks' },
      { status: 500 }
    );
  }
}

// POST /api/rocks - Create a new rock
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: rock, error } = await supabase
      .from('Rock')
      .insert({
        organizationId,
        title: body.title,
        description: body.description || null,
        owner: body.owner,
        rockType: body.rockType || 'company',
        quarter: body.quarter,
        year: body.year,
        status: body.status || 'on_track',
        dueDate: body.dueDate,
        milestones: body.milestones || [],
        statusHistory: body.statusHistory || [],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(rock, { status: 201 });
  } catch (error) {
    console.error('Error creating rock:', error);
    return NextResponse.json(
      { error: 'Failed to create rock' },
      { status: 500 }
    );
  }
}

// PUT /api/rocks - Update a rock
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
        { error: 'Rock ID is required' },
        { status: 400 }
      );
    }

    const { data: rock, error } = await supabase
      .from('Rock')
      .update({
        title: body.title,
        description: body.description,
        owner: body.owner,
        rockType: body.rockType,
        quarter: body.quarter,
        year: body.year,
        status: body.status,
        dueDate: body.dueDate,
        milestones: body.milestones,
        statusHistory: body.statusHistory,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', body.id)
      .eq('organizationId', organizationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(rock);
  } catch (error) {
    console.error('Error updating rock:', error);
    return NextResponse.json(
      { error: 'Failed to update rock' },
      { status: 500 }
    );
  }
}

// DELETE /api/rocks - Delete a rock
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
        { error: 'Rock ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('Rock')
      .delete()
      .eq('id', id)
      .eq('organizationId', organizationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rock:', error);
    return NextResponse.json(
      { error: 'Failed to delete rock' },
      { status: 500 }
    );
  }
}

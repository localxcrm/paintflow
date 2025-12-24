import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

// GET /api/room-types - List all room types
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabase
      .from('RoomType')
      .select('*')
      .eq('organizationId', organizationId)
      .order('order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('isActive', true);
    }

    const { data: roomTypes, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ roomTypes: roomTypes || [] });
  } catch (error) {
    console.error('Error fetching room types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room types' },
      { status: 500 }
    );
  }
}

// POST /api/room-types - Create a new room type
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get max order for this organization
    const { data: maxOrderResult } = await supabase
      .from('RoomType')
      .select('order')
      .eq('organizationId', organizationId)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderResult?.order || 0) + 1;

    const { data: roomType, error } = await supabase
      .from('RoomType')
      .insert({
        organizationId,
        name: body.name,
        description: body.description || null,
        type: body.type || 'room',
        defaultScope: body.defaultScope || ['Paredes'],
        isActive: true,
        order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Já existe um cômodo com este nome' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(roomType, { status: 201 });
  } catch (error) {
    console.error('Error creating room type:', error);
    return NextResponse.json(
      { error: 'Failed to create room type' },
      { status: 500 }
    );
  }
}

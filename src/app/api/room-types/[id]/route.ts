import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

// GET /api/room-types/[id] - Get single room type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: roomType, error } = await supabase
      .from('RoomType')
      .select('*')
      .eq('id', id)
      .eq('organizationId', organizationId)
      .single();

    if (error || !roomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 });
    }

    return NextResponse.json(roomType);
  } catch (error) {
    console.error('Error fetching room type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room type' },
      { status: 500 }
    );
  }
}

// PATCH /api/room-types/[id] - Update room type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.defaultScope !== undefined) updateData.defaultScope = body.defaultScope;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.order !== undefined) updateData.order = body.order;

    const { data: roomType, error } = await supabase
      .from('RoomType')
      .update(updateData)
      .eq('id', id)
      .eq('organizationId', organizationId)
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

    if (!roomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 });
    }

    return NextResponse.json(roomType);
  } catch (error) {
    console.error('Error updating room type:', error);
    return NextResponse.json(
      { error: 'Failed to update room type' },
      { status: 500 }
    );
  }
}

// DELETE /api/room-types/[id] - Delete room type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('RoomType')
      .delete()
      .eq('id', id)
      .eq('organizationId', organizationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room type:', error);
    return NextResponse.json(
      { error: 'Failed to delete room type' },
      { status: 500 }
    );
  }
}

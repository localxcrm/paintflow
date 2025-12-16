import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/price-book/rooms/[id] - Get a single room price
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data: roomPrice, error } = await supabase
      .from('RoomPrice')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Room price not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(roomPrice);
  } catch (error) {
    console.error('Error fetching room price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room price' },
      { status: 500 }
    );
  }
}

// PATCH /api/price-book/rooms/[id] - Update a room price
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: any = { updatedAt: new Date().toISOString() };

    if (body.roomType !== undefined) updateData.roomType = body.roomType;
    if (body.size !== undefined) updateData.size = body.size;
    if (body.typicalSqft !== undefined) updateData.typicalSqft = body.typicalSqft;
    if (body.wallsOnly !== undefined) updateData.wallsOnly = body.wallsOnly;
    if (body.wallsTrim !== undefined) updateData.wallsTrim = body.wallsTrim;
    if (body.wallsTrimCeiling !== undefined) updateData.wallsTrimCeiling = body.wallsTrimCeiling;
    if (body.fullRefresh !== undefined) updateData.fullRefresh = body.fullRefresh;

    const { data: roomPrice, error } = await supabase
      .from('RoomPrice')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(roomPrice);
  } catch (error) {
    console.error('Error updating room price:', error);
    return NextResponse.json(
      { error: 'Failed to update room price' },
      { status: 500 }
    );
  }
}

// DELETE /api/price-book/rooms/[id] - Delete a room price
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('RoomPrice')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room price:', error);
    return NextResponse.json(
      { error: 'Failed to delete room price' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/seats/[id] - Get a single seat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data: seat, error } = await supabase
      .from('Seat')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Seat not found' },
        { status: 404 }
      );
    }

    if (error) throw error;

    // Fetch related seats
    let reportsTo = null;
    if (seat.reportsToId) {
      const { data: reportsToSeat } = await supabase
        .from('Seat')
        .select('*')
        .eq('id', seat.reportsToId)
        .single();
      reportsTo = reportsToSeat;
    }

    const { data: directReports } = await supabase
      .from('Seat')
      .select('*')
      .eq('reportsToId', seat.id);

    return NextResponse.json({
      ...seat,
      reportsTo,
      directReports: directReports || [],
    });
  } catch (error) {
    console.error('Error fetching seat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seat' },
      { status: 500 }
    );
  }
}

// PATCH /api/traction/seats/[id] - Update a seat
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.seatName !== undefined) updateData.seatName = body.seatName;
    if (body.roleDescription !== undefined) updateData.roleDescription = body.roleDescription;
    if (body.responsibilities !== undefined) updateData.responsibilities = body.responsibilities;
    if (body.personName !== undefined) updateData.personName = body.personName;
    if (body.personId !== undefined) updateData.personId = body.personId;
    if (body.reportsToId !== undefined) updateData.reportsToId = body.reportsToId;
    if (body.gwcGetsIt !== undefined) updateData.gwcGetsIt = body.gwcGetsIt;
    if (body.gwcWantsIt !== undefined) updateData.gwcWantsIt = body.gwcWantsIt;
    if (body.gwcCapacity !== undefined) updateData.gwcCapacity = body.gwcCapacity;
    if (body.isRightPersonRightSeat !== undefined) updateData.isRightPersonRightSeat = body.isRightPersonRightSeat;

    const { data: seat, error } = await supabase
      .from('Seat')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Fetch related seats
    let reportsTo = null;
    if (seat.reportsToId) {
      const { data: reportsToSeat } = await supabase
        .from('Seat')
        .select('*')
        .eq('id', seat.reportsToId)
        .single();
      reportsTo = reportsToSeat;
    }

    const { data: directReports } = await supabase
      .from('Seat')
      .select('*')
      .eq('reportsToId', seat.id);

    return NextResponse.json({
      ...seat,
      reportsTo,
      directReports: directReports || [],
    });
  } catch (error) {
    console.error('Error updating seat:', error);
    return NextResponse.json(
      { error: 'Failed to update seat' },
      { status: 500 }
    );
  }
}

// DELETE /api/traction/seats/[id] - Delete a seat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('Seat')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting seat:', error);
    return NextResponse.json(
      { error: 'Failed to delete seat' },
      { status: 500 }
    );
  }
}

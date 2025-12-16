import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/meetings/[id] - Get a single meeting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data: meeting, error } = await supabase
      .from('Meeting')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (error) throw error;

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    );
  }
}

// PATCH /api/traction/meetings/[id] - Update a meeting
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.meetingDate !== undefined) updateData.meetingDate = new Date(body.meetingDate).toISOString();
    if (body.meetingType !== undefined) updateData.meetingType = body.meetingType;
    if (body.attendees !== undefined) updateData.attendees = body.attendees;
    if (body.ratingAvg !== undefined) updateData.ratingAvg = body.ratingAvg;
    if (body.segueNotes !== undefined) updateData.segueNotes = body.segueNotes;
    if (body.headlines !== undefined) updateData.headlines = body.headlines;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: meeting, error } = await supabase
      .from('Meeting')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    );
  }
}

// DELETE /api/traction/meetings/[id] - Delete a meeting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('Meeting')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}

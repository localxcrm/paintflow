import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/rocks/[id] - Get a single rock
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data: rock, error } = await supabase
      .from('Rock')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Rock not found' },
        { status: 404 }
      );
    }

    if (error) throw error;

    return NextResponse.json(rock);
  } catch (error) {
    console.error('Error fetching rock:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rock' },
      { status: 500 }
    );
  }
}

// PATCH /api/traction/rocks/[id] - Update a rock
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.owner !== undefined) updateData.owner = body.owner;
    if (body.rockType !== undefined) updateData.rockType = body.rockType;
    if (body.quarter !== undefined) updateData.quarter = body.quarter;
    if (body.year !== undefined) updateData.year = body.year;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate).toISOString();

    const { data: rock, error } = await supabase
      .from('Rock')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(rock);
  } catch (error) {
    console.error('Error updating rock:', error);
    return NextResponse.json(
      { error: 'Failed to update rock' },
      { status: 500 }
    );
  }
}

// DELETE /api/traction/rocks/[id] - Delete a rock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('Rock')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rock:', error);
    return NextResponse.json(
      { error: 'Failed to delete rock' },
      { status: 500 }
    );
  }
}

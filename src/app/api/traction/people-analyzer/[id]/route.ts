import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/people-analyzer/[id] - Get a single people analyzer record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data: record, error } = await supabase
      .from('PeopleAnalyzer')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'People analyzer record not found' },
        { status: 404 }
      );
    }

    if (error) throw error;

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching people analyzer record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people analyzer record' },
      { status: 500 }
    );
  }
}

// PATCH /api/traction/people-analyzer/[id] - Update a people analyzer record
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.personName !== undefined) updateData.personName = body.personName;
    if (body.reviewDate !== undefined) updateData.reviewDate = new Date(body.reviewDate).toISOString();
    if (body.coreValueRatings !== undefined) updateData.coreValueRatings = body.coreValueRatings;
    if (body.gwcGetsIt !== undefined) updateData.gwcGetsIt = body.gwcGetsIt;
    if (body.gwcWantsIt !== undefined) updateData.gwcWantsIt = body.gwcWantsIt;
    if (body.gwcCapacity !== undefined) updateData.gwcCapacity = body.gwcCapacity;
    if (body.overallStatus !== undefined) updateData.overallStatus = body.overallStatus;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: record, error } = await supabase
      .from('PeopleAnalyzer')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating people analyzer record:', error);
    return NextResponse.json(
      { error: 'Failed to update people analyzer record' },
      { status: 500 }
    );
  }
}

// DELETE /api/traction/people-analyzer/[id] - Delete a people analyzer record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('PeopleAnalyzer')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting people analyzer record:', error);
    return NextResponse.json(
      { error: 'Failed to delete people analyzer record' },
      { status: 500 }
    );
  }
}

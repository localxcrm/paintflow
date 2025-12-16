import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/scorecard/[id] - Get a single scorecard metric
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const weeksBack = parseInt(searchParams.get('weeksBack') || '13');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeksBack * 7);

    const { data: metric, error: metricError } = await supabase
      .from('ScorecardMetric')
      .select('*')
      .eq('id', id)
      .single();

    if (metricError && metricError.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Scorecard metric not found' },
        { status: 404 }
      );
    }

    if (metricError) throw metricError;

    // Fetch entries for this metric
    const { data: entries, error: entriesError } = await supabase
      .from('ScorecardEntry')
      .select('*')
      .eq('metricId', id)
      .gte('weekEndingDate', startDate.toISOString())
      .order('weekEndingDate', { ascending: false });

    if (entriesError) throw entriesError;

    return NextResponse.json({ ...metric, entries: entries || [] });
  } catch (error) {
    console.error('Error fetching scorecard metric:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scorecard metric' },
      { status: 500 }
    );
  }
}

// PATCH /api/traction/scorecard/[id] - Update a scorecard metric
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.owner !== undefined) updateData.owner = body.owner;
    if (body.goalValue !== undefined) updateData.goalValue = body.goalValue;
    if (body.goalType !== undefined) updateData.goalType = body.goalType;
    if (body.goalDirection !== undefined) updateData.goalDirection = body.goalDirection;
    if (body.category !== undefined) updateData.category = body.category;

    const { data: metric, error: metricError } = await supabase
      .from('ScorecardMetric')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (metricError) throw metricError;

    // Fetch last 13 entries
    const { data: entries, error: entriesError } = await supabase
      .from('ScorecardEntry')
      .select('*')
      .eq('metricId', id)
      .order('weekEndingDate', { ascending: false })
      .limit(13);

    if (entriesError) throw entriesError;

    return NextResponse.json({ ...metric, entries: entries || [] });
  } catch (error) {
    console.error('Error updating scorecard metric:', error);
    return NextResponse.json(
      { error: 'Failed to update scorecard metric' },
      { status: 500 }
    );
  }
}

// DELETE /api/traction/scorecard/[id] - Delete a scorecard metric
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('ScorecardMetric')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scorecard metric:', error);
    return NextResponse.json(
      { error: 'Failed to delete scorecard metric' },
      { status: 500 }
    );
  }
}

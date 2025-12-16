import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// POST /api/traction/scorecard/[id]/entries - Add an entry to a scorecard metric
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // Get the metric to check goal
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

    // Determine if on track
    const actualValue = body.actualValue;
    let onTrack = false;

    if (metric.goalDirection === 'above') {
      onTrack = actualValue >= metric.goalValue;
    } else {
      onTrack = actualValue <= metric.goalValue;
    }

    const weekEndingDate = new Date(body.weekEndingDate).toISOString();

    // Check if entry already exists
    const { data: existingEntry } = await supabase
      .from('ScorecardEntry')
      .select('*')
      .eq('metricId', id)
      .eq('weekEndingDate', weekEndingDate)
      .single();

    let entry;
    if (existingEntry) {
      // Update existing entry
      const { data: updatedEntry, error: updateError } = await supabase
        .from('ScorecardEntry')
        .update({
          actualValue,
          onTrack,
        })
        .eq('metricId', id)
        .eq('weekEndingDate', weekEndingDate)
        .select()
        .single();

      if (updateError) throw updateError;
      entry = updatedEntry;
    } else {
      // Create new entry
      const { data: newEntry, error: createError } = await supabase
        .from('ScorecardEntry')
        .insert({
          metricId: id,
          weekEndingDate,
          actualValue,
          onTrack,
        })
        .select()
        .single();

      if (createError) throw createError;
      entry = newEntry;
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error adding scorecard entry:', error);
    return NextResponse.json(
      { error: 'Failed to add scorecard entry' },
      { status: 500 }
    );
  }
}

// GET /api/traction/scorecard/[id]/entries - Get entries for a scorecard metric
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

    const { data: entries, error } = await supabase
      .from('ScorecardEntry')
      .select('*')
      .eq('metricId', id)
      .gte('weekEndingDate', startDate.toISOString())
      .order('weekEndingDate', { ascending: false });

    if (error) throw error;

    return NextResponse.json(entries || []);
  } catch (error) {
    console.error('Error fetching scorecard entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scorecard entries' },
      { status: 500 }
    );
  }
}

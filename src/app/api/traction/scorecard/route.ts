import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/scorecard - Get all scorecard metrics with entries
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const category = searchParams.get('category');
    const weeksBack = parseInt(searchParams.get('weeksBack') || '13');

    // Calculate the date range for entries
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeksBack * 7);

    let query = supabase
      .from('ScorecardMetric')
      .select('*')
      .order('name', { ascending: true });

    if (owner) {
      query = query.eq('owner', owner);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: metrics, error: metricsError } = await query;

    if (metricsError) throw metricsError;

    // For each metric, fetch its entries
    const metricsWithEntries = await Promise.all(
      (metrics || []).map(async (metric) => {
        const { data: entries, error: entriesError } = await supabase
          .from('ScorecardEntry')
          .select('*')
          .eq('metricId', metric.id)
          .gte('weekEndingDate', startDate.toISOString())
          .order('weekEndingDate', { ascending: false });

        if (entriesError) throw entriesError;

        return {
          ...metric,
          entries: entries || [],
        };
      })
    );

    return NextResponse.json(metricsWithEntries);
  } catch (error) {
    console.error('Error fetching scorecard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scorecard' },
      { status: 500 }
    );
  }
}

// POST /api/traction/scorecard - Create a new scorecard metric
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: metric, error } = await supabase
      .from('ScorecardMetric')
      .insert({
        name: body.name,
        owner: body.owner,
        goalValue: body.goalValue,
        goalType: body.goalType || 'number',
        goalDirection: body.goalDirection || 'above',
        category: body.category || 'leading',
      })
      .select()
      .single();

    if (error) throw error;

    // Return metric with empty entries array
    return NextResponse.json({ ...metric, entries: [] }, { status: 201 });
  } catch (error) {
    console.error('Error creating scorecard metric:', error);
    return NextResponse.json(
      { error: 'Failed to create scorecard metric' },
      { status: 500 }
    );
  }
}

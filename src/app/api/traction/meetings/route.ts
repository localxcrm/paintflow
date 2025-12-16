import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/meetings - Get all meetings
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const meetingType = searchParams.get('meetingType');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('Meeting')
      .select('*', { count: 'exact' })
      .order('meetingDate', { ascending: false })
      .range(offset, offset + limit - 1);

    if (meetingType) {
      query = query.eq('meetingType', meetingType);
    }

    const { data: meetings, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      meetings: meetings || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

// POST /api/traction/meetings - Create a new meeting
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: meeting, error } = await supabase
      .from('Meeting')
      .insert({
        meetingDate: new Date(body.meetingDate).toISOString(),
        meetingType: body.meetingType || 'l10',
        attendees: body.attendees || [],
        ratingAvg: body.ratingAvg || 0,
        segueNotes: body.segueNotes,
        headlines: body.headlines,
        notes: body.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/people-analyzer - Get all people analyzer records
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');
    const overallStatus = searchParams.get('overallStatus');

    let query = supabase
      .from('PeopleAnalyzer')
      .select('*')
      .order('reviewDate', { ascending: false });

    if (personId) {
      query = query.eq('personId', personId);
    }

    if (overallStatus) {
      query = query.eq('overallStatus', overallStatus);
    }

    const { data: records, error } = await query;

    if (error) throw error;

    return NextResponse.json(records || []);
  } catch (error) {
    console.error('Error fetching people analyzer records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people analyzer records' },
      { status: 500 }
    );
  }
}

// POST /api/traction/people-analyzer - Create a new people analyzer record
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: record, error } = await supabase
      .from('PeopleAnalyzer')
      .insert({
        personName: body.personName,
        personId: body.personId,
        reviewDate: body.reviewDate ? new Date(body.reviewDate).toISOString() : new Date().toISOString(),
        coreValueRatings: body.coreValueRatings || {},
        gwcGetsIt: body.gwcGetsIt ?? true,
        gwcWantsIt: body.gwcWantsIt ?? true,
        gwcCapacity: body.gwcCapacity ?? true,
        overallStatus: body.overallStatus || 'right_person_right_seat',
        notes: body.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating people analyzer record:', error);
    return NextResponse.json(
      { error: 'Failed to create people analyzer record' },
      { status: 500 }
    );
  }
}

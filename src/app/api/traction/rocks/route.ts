import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/rocks - Get all rocks
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get('quarter');
    const year = searchParams.get('year');
    const owner = searchParams.get('owner');
    const rockType = searchParams.get('rockType');
    const status = searchParams.get('status');

    let query = supabase
      .from('Rock')
      .select('*')
      .order('year', { ascending: false })
      .order('quarter', { ascending: false })
      .order('dueDate', { ascending: true });

    if (quarter) {
      query = query.eq('quarter', parseInt(quarter));
    }

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    if (owner) {
      query = query.eq('owner', owner);
    }

    if (rockType) {
      query = query.eq('rockType', rockType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: rocks, error } = await query;

    if (error) throw error;

    return NextResponse.json(rocks || []);
  } catch (error) {
    console.error('Error fetching rocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rocks' },
      { status: 500 }
    );
  }
}

// POST /api/traction/rocks - Create a new rock
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: rock, error } = await supabase
      .from('Rock')
      .insert({
        title: body.title,
        description: body.description,
        owner: body.owner,
        rockType: body.rockType || 'individual',
        quarter: body.quarter,
        year: body.year,
        status: body.status || 'on_track',
        dueDate: new Date(body.dueDate).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(rock, { status: 201 });
  } catch (error) {
    console.error('Error creating rock:', error);
    return NextResponse.json(
      { error: 'Failed to create rock' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/issues - Get all issues
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const issueType = searchParams.get('issueType');
    const status = searchParams.get('status');
    const createdBy = searchParams.get('createdBy');

    let query = supabase
      .from('Issue')
      .select('*')
      .order('priority', { ascending: true })
      .order('createdAt', { ascending: false });

    if (issueType) {
      query = query.eq('issueType', issueType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (createdBy) {
      query = query.eq('createdBy', createdBy);
    }

    const { data: issues, error } = await query;

    if (error) throw error;

    return NextResponse.json(issues || []);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

// POST /api/traction/issues - Create a new issue
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: issue, error } = await supabase
      .from('Issue')
      .insert({
        title: body.title,
        description: body.description,
        issueType: body.issueType || 'short_term',
        priority: body.priority || 2,
        status: body.status || 'open',
        createdBy: body.createdBy,
        resolution: body.resolution,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}

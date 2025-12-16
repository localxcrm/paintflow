import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/team - Get all team members
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('TeamMember')
      .select('*');

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (isActive !== null) {
      query = query.eq('isActive', isActive === 'true');
    }

    // Search across multiple fields
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply ordering
    query = query.order('name', { ascending: true });

    const { data: teamMembers, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(teamMembers || []);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/team - Create a new team member
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: teamMember, error } = await supabase
      .from('TeamMember')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role || 'both',
        defaultCommissionPct: body.defaultCommissionPct || 5,
        isActive: body.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(teamMember, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}

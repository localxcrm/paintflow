import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase';

// GET /api/team - Get all team members
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';
    const role = searchParams.get('role');

    let query = supabase
      .from('TeamMember')
      .select('*')
      .eq('organizationId', organizationId)
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('isActive', true);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data: teamMembers, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ teamMembers: teamMembers || [] });
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
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: teamMember, error } = await supabase
      .from('TeamMember')
      .insert({
        organizationId,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        role: body.role || 'sales',
        defaultCommissionPct: body.defaultCommissionPct || 5,
        isActive: body.isActive !== false,
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

// PUT /api/team - Update a team member
export async function PUT(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      );
    }

    const { data: teamMember, error } = await supabase
      .from('TeamMember')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role,
        defaultCommissionPct: body.defaultCommissionPct,
        isActive: body.isActive,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', body.id)
      .eq('organizationId', organizationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(teamMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

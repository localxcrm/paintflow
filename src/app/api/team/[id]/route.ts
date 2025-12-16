import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/team/[id] - Get a single team member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    // Get team member
    const { data: teamMember, error: memberError } = await supabase
      .from('TeamMember')
      .select('*')
      .eq('id', id)
      .single();

    if (memberError) {
      if (memberError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Team member not found' },
          { status: 404 }
        );
      }
      throw memberError;
    }

    // Get related sales jobs (limit 10, most recent)
    const { data: salesJobs } = await supabase
      .from('Job')
      .select('*')
      .eq('salesRepId', id)
      .order('jobDate', { ascending: false })
      .limit(10);

    // Get related PM jobs (limit 10, most recent)
    const { data: pmJobs } = await supabase
      .from('Job')
      .select('*')
      .eq('projectManagerId', id)
      .order('jobDate', { ascending: false })
      .limit(10);

    // Get assigned leads (limit 10, most recent)
    const { data: assignedLeads } = await supabase
      .from('Lead')
      .select('*')
      .eq('assignedToId', id)
      .order('leadDate', { ascending: false })
      .limit(10);

    // Combine results
    const result = {
      ...teamMember,
      salesJobs: salesJobs || [],
      pmJobs: pmJobs || [],
      assignedLeads: assignedLeads || [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching team member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    );
  }
}

// PATCH /api/team/[id] - Update a team member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: any = { updatedAt: new Date().toISOString() };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.defaultCommissionPct !== undefined) updateData.defaultCommissionPct = body.defaultCommissionPct;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const { data: teamMember, error } = await supabase
      .from('TeamMember')
      .update(updateData)
      .eq('id', id)
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

// DELETE /api/team/[id] - Delete a team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('TeamMember')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}

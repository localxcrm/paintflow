import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

// GET /api/team/[id] - Get a single team member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data: teamMember, error } = await supabase
      .from('TeamMember')
      .select('*')
      .eq('id', id)
      .eq('organizationId', organizationId)
      .single();

    if (error || !teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Get recent sales jobs
    const { data: salesJobs } = await supabase
      .from('Job')
      .select('*')
      .eq('salespersonId', id)
      .eq('organizationId', organizationId)
      .order('jobDate', { ascending: false })
      .limit(10);

    // Get recent PM jobs
    const { data: pmJobs } = await supabase
      .from('Job')
      .select('*')
      .eq('projectManagerId', id)
      .eq('organizationId', organizationId)
      .order('jobDate', { ascending: false })
      .limit(10);

    // Get assigned leads
    const { data: assignedLeads } = await supabase
      .from('Lead')
      .select('*')
      .eq('assignedTo', id)
      .eq('organizationId', organizationId)
      .order('leadDate', { ascending: false })
      .limit(10);

    return NextResponse.json({
      ...teamMember,
      salesJobs: salesJobs || [],
      pmJobs: pmJobs || [],
      assignedLeads: assignedLeads || [],
    });
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
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createServerSupabaseClient();

    const updateData: Record<string, unknown> = {};
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
      .eq('organizationId', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating team member:', error);
      return NextResponse.json(
        { error: 'Failed to update team member' },
        { status: 500 }
      );
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
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('TeamMember')
      .delete()
      .eq('id', id)
      .eq('organizationId', organizationId);

    if (error) {
      console.error('Error deleting team member:', error);
      return NextResponse.json(
        { error: 'Failed to delete team member' },
        { status: 500 }
      );
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

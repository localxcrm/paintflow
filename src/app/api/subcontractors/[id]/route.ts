import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/subcontractors/[id] - Get a single subcontractor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data: subcontractor, error } = await supabase
      .from('Subcontractor')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !subcontractor) {
      return NextResponse.json(
        { error: 'Subcontractor not found' },
        { status: 404 }
      );
    }

    // Get recent jobs for this subcontractor
    const { data: jobs } = await supabase
      .from('Job')
      .select('*')
      .eq('subcontractorId', id)
      .order('jobDate', { ascending: false })
      .limit(10);

    return NextResponse.json({
      ...subcontractor,
      jobs: jobs || [],
    });
  } catch (error) {
    console.error('Error fetching subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subcontractor' },
      { status: 500 }
    );
  }
}

// PATCH /api/subcontractors/[id] - Update a subcontractor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.companyName !== undefined) updateData.companyName = body.companyName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.specialty !== undefined) updateData.specialty = body.specialty;
    if (body.defaultPayoutPct !== undefined) updateData.defaultPayoutPct = body.defaultPayoutPct;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const { data: subcontractor, error } = await supabase
      .from('Subcontractor')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subcontractor:', error);
      return NextResponse.json(
        { error: 'Failed to update subcontractor' },
        { status: 500 }
      );
    }

    return NextResponse.json(subcontractor);
  } catch (error) {
    console.error('Error updating subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to update subcontractor' },
      { status: 500 }
    );
  }
}

// DELETE /api/subcontractors/[id] - Delete a subcontractor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('Subcontractor')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subcontractor:', error);
      return NextResponse.json(
        { error: 'Failed to delete subcontractor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to delete subcontractor' },
      { status: 500 }
    );
  }
}

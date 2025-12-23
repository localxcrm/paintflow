import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase';

// GET /api/weekly-sales - Get weekly sales entries for organization
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let query = supabase
      .from('WeeklySales')
      .select('*')
      .eq('organizationId', organizationId)
      .order('weekStart', { ascending: false });

    // Filter by year if provided
    if (year) {
      const startDate = new Date(parseInt(year), month ? parseInt(month) : 0, 1);
      const endDate = new Date(parseInt(year), month ? parseInt(month) + 1 : 12, 0);
      query = query
        .gte('weekStart', startDate.toISOString().split('T')[0])
        .lte('weekStart', endDate.toISOString().split('T')[0]);
    }

    const { data: entries, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ entries: entries || [] });
  } catch (error) {
    console.error('Error fetching weekly sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly sales' },
      { status: 500 }
    );
  }
}

// POST /api/weekly-sales - Create or update a weekly sales entry
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.weekStart) {
      return NextResponse.json(
        { error: 'weekStart is required' },
        { status: 400 }
      );
    }

    // Check if entry for this week already exists for this organization
    const { data: existingEntry } = await supabase
      .from('WeeklySales')
      .select('id')
      .eq('organizationId', organizationId)
      .eq('weekStart', body.weekStart)
      .single();

    let result;

    if (existingEntry) {
      // Update existing entry
      const { data, error } = await supabase
        .from('WeeklySales')
        .update({
          leads: body.leads || 0,
          estimates: body.estimates || 0,
          sales: body.sales || 0,
          revenue: body.revenue || 0,
          channels: body.channels || {},
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingEntry.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from('WeeklySales')
        .insert({
          organizationId,
          weekStart: body.weekStart,
          leads: body.leads || 0,
          estimates: body.estimates || 0,
          sales: body.sales || 0,
          revenue: body.revenue || 0,
          channels: body.channels || {},
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving weekly sales:', error);
    return NextResponse.json(
      { error: 'Failed to save weekly sales' },
      { status: 500 }
    );
  }
}

// DELETE /api/weekly-sales - Delete a weekly sales entry
export async function DELETE(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Ensure entry belongs to this organization
    const { error } = await supabase
      .from('WeeklySales')
      .delete()
      .eq('id', id)
      .eq('organizationId', organizationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting weekly sales:', error);
    return NextResponse.json(
      { error: 'Failed to delete weekly sales' },
      { status: 500 }
    );
  }
}

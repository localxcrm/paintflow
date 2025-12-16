import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { LeadWithAssignedTo } from '@/types/database';

// GET /api/leads - Get all leads with optional filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('Lead')
      .select('*, TeamMember(*)', { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Search across multiple fields (Supabase doesn't have contains, use ilike)
    if (search) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`);
    }

    // Apply ordering, limit, and offset
    query = query
      .order('leadDate', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: leads, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: lead, error } = await supabase
      .from('Lead')
      .insert({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        source: body.source,
        status: body.status || 'new',
        projectType: body.projectType || 'interior',
        leadDate: body.leadDate || new Date().toISOString(),
        nextFollowupDate: body.nextFollowupDate || null,
        estimatedJobValue: body.estimatedJobValue || null,
        notes: body.notes || null,
        assignedToId: body.assignedToId || null,
      })
      .select('*, TeamMember(*)')
      .single<LeadWithAssignedTo>();

    if (error) {
      throw error;
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/leads - Delete multiple leads (bulk delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('Lead')
      .delete()
      .in('id', ids);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error) {
    console.error('Error deleting leads:', error);
    return NextResponse.json(
      { error: 'Failed to delete leads' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase';

// GET /api/subcontractors - Get all subcontractors
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    let query = supabase
      .from('Subcontractor')
      .select('*')
      .eq('organizationId', organizationId)
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('isActive', true);
    }

    const { data: subcontractors, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ subcontractors: subcontractors || [] });
  } catch (error) {
    console.error('Error fetching subcontractors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subcontractors' },
      { status: 500 }
    );
  }
}

// POST /api/subcontractors - Create a new subcontractor
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: subcontractor, error } = await supabase
      .from('Subcontractor')
      .insert({
        organizationId,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        specialty: body.specialty || 'both',
        defaultPayoutPct: body.defaultPayoutPct || 60,
        color: body.color || '#10B981',
        isActive: body.isActive !== false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(subcontractor, { status: 201 });
  } catch (error) {
    console.error('Error creating subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to create subcontractor' },
      { status: 500 }
    );
  }
}

// PUT /api/subcontractors - Update a subcontractor
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
        { error: 'Subcontractor ID is required' },
        { status: 400 }
      );
    }

    const { data: subcontractor, error } = await supabase
      .from('Subcontractor')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        specialty: body.specialty,
        defaultPayoutPct: body.defaultPayoutPct,
        color: body.color,
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

    return NextResponse.json(subcontractor);
  } catch (error) {
    console.error('Error updating subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to update subcontractor' },
      { status: 500 }
    );
  }
}

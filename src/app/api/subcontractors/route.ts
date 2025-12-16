import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/subcontractors - Get all subcontractors
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('Subcontractor')
      .select('*');

    // Apply filters
    if (specialty) {
      query = query.eq('specialty', specialty);
    }

    if (isActive !== null) {
      query = query.eq('isActive', isActive === 'true');
    }

    // Search across multiple fields
    if (search) {
      query = query.or(`name.ilike.%${search}%,companyName.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply ordering
    query = query.order('name', { ascending: true });

    const { data: subcontractors, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(subcontractors || []);
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
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: subcontractor, error } = await supabase
      .from('Subcontractor')
      .insert({
        name: body.name,
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        specialty: body.specialty || 'both',
        defaultPayoutPct: body.defaultPayoutPct || 60,
        isActive: body.isActive ?? true,
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

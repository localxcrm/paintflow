import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/price-book/addons - Get all addons
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('Addon')
      .select('*');

    if (category) {
      query = query.eq('category', category);
    }

    query = query.order('name', { ascending: true });

    const { data: addons, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(addons || []);
  } catch (error) {
    console.error('Error fetching addons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addons' },
      { status: 500 }
    );
  }
}

// POST /api/price-book/addons - Create a new addon
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: addon, error } = await supabase
      .from('Addon')
      .insert({
        name: body.name,
        category: body.category || 'both',
        unit: body.unit,
        basePrice: body.basePrice,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(addon, { status: 201 });
  } catch (error) {
    console.error('Error creating addon:', error);
    return NextResponse.json(
      { error: 'Failed to create addon' },
      { status: 500 }
    );
  }
}

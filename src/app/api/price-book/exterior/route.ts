import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/price-book/exterior - Get all exterior prices
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: exteriorPrices, error } = await supabase
      .from('ExteriorPrice')
      .select('*')
      .order('surfaceType', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(exteriorPrices || []);
  } catch (error) {
    console.error('Error fetching exterior prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exterior prices' },
      { status: 500 }
    );
  }
}

// POST /api/price-book/exterior - Create a new exterior price
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: exteriorPrice, error } = await supabase
      .from('ExteriorPrice')
      .insert({
        surfaceType: body.surfaceType,
        pricePerSqft: body.pricePerSqft,
        prepMultiplier: body.prepMultiplier || 1.0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(exteriorPrice, { status: 201 });
  } catch (error) {
    console.error('Error creating exterior price:', error);
    return NextResponse.json(
      { error: 'Failed to create exterior price' },
      { status: 500 }
    );
  }
}

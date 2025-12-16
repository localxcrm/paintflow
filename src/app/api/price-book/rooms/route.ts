import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/price-book/rooms - Get all room prices
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const roomType = searchParams.get('roomType');
    const size = searchParams.get('size');

    let query = supabase
      .from('RoomPrice')
      .select('*');

    if (roomType) {
      query = query.eq('roomType', roomType);
    }

    if (size) {
      query = query.eq('size', size);
    }

    query = query.order('roomType', { ascending: true }).order('size', { ascending: true });

    const { data: roomPrices, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(roomPrices || []);
  } catch (error) {
    console.error('Error fetching room prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room prices' },
      { status: 500 }
    );
  }
}

// POST /api/price-book/rooms - Create a new room price
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: roomPrice, error } = await supabase
      .from('RoomPrice')
      .insert({
        roomType: body.roomType,
        size: body.size,
        typicalSqft: body.typicalSqft,
        wallsOnly: body.wallsOnly,
        wallsTrim: body.wallsTrim,
        wallsTrimCeiling: body.wallsTrimCeiling,
        fullRefresh: body.fullRefresh,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(roomPrice, { status: 201 });
  } catch (error) {
    console.error('Error creating room price:', error);
    return NextResponse.json(
      { error: 'Failed to create room price' },
      { status: 500 }
    );
  }
}

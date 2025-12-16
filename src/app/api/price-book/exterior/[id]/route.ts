import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/price-book/exterior/[id] - Get a single exterior price
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data: exteriorPrice, error } = await supabase
      .from('ExteriorPrice')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Exterior price not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(exteriorPrice);
  } catch (error) {
    console.error('Error fetching exterior price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exterior price' },
      { status: 500 }
    );
  }
}

// PATCH /api/price-book/exterior/[id] - Update an exterior price
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: any = { updatedAt: new Date().toISOString() };

    if (body.surfaceType !== undefined) updateData.surfaceType = body.surfaceType;
    if (body.pricePerSqft !== undefined) updateData.pricePerSqft = body.pricePerSqft;
    if (body.prepMultiplier !== undefined) updateData.prepMultiplier = body.prepMultiplier;

    const { data: exteriorPrice, error } = await supabase
      .from('ExteriorPrice')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(exteriorPrice);
  } catch (error) {
    console.error('Error updating exterior price:', error);
    return NextResponse.json(
      { error: 'Failed to update exterior price' },
      { status: 500 }
    );
  }
}

// DELETE /api/price-book/exterior/[id] - Delete an exterior price
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('ExteriorPrice')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exterior price:', error);
    return NextResponse.json(
      { error: 'Failed to delete exterior price' },
      { status: 500 }
    );
  }
}

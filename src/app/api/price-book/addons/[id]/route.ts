import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/price-book/addons/[id] - Get a single addon
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data: addon, error } = await supabase
      .from('Addon')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Addon not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(addon);
  } catch (error) {
    console.error('Error fetching addon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addon' },
      { status: 500 }
    );
  }
}

// PATCH /api/price-book/addons/[id] - Update an addon
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const updateData: any = { updatedAt: new Date().toISOString() };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.basePrice !== undefined) updateData.basePrice = body.basePrice;

    const { data: addon, error } = await supabase
      .from('Addon')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(addon);
  } catch (error) {
    console.error('Error updating addon:', error);
    return NextResponse.json(
      { error: 'Failed to update addon' },
      { status: 500 }
    );
  }
}

// DELETE /api/price-book/addons/[id] - Delete an addon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('Addon')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting addon:', error);
    return NextResponse.json(
      { error: 'Failed to delete addon' },
      { status: 500 }
    );
  }
}

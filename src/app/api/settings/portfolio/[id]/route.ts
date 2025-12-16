import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/settings/portfolio/[id] - Get a single portfolio image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data: portfolioImage, error } = await supabase
      .from('PortfolioImage')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Portfolio image not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(portfolioImage);
  } catch (error) {
    console.error('Error fetching portfolio image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio image' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/portfolio/[id] - Delete a portfolio image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('PortfolioImage')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting portfolio image:', error);
    return NextResponse.json(
      { error: 'Failed to delete portfolio image' },
      { status: 500 }
    );
  }
}

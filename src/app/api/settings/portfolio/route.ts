import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/settings/portfolio - Get all portfolio images
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const projectType = searchParams.get('projectType');

    let query = supabase
      .from('PortfolioImage')
      .select('*');

    if (projectType) {
      query = query.eq('projectType', projectType);
    }

    query = query.order('createdAt', { ascending: false });

    const { data: portfolioImages, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(portfolioImages || []);
  } catch (error) {
    console.error('Error fetching portfolio images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio images' },
      { status: 500 }
    );
  }
}

// POST /api/settings/portfolio - Add a new portfolio image
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: portfolioImage, error } = await supabase
      .from('PortfolioImage')
      .insert({
        beforeUrl: body.beforeUrl,
        afterUrl: body.afterUrl,
        projectType: body.projectType || 'interior',
        description: body.description,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(portfolioImage, { status: 201 });
  } catch (error) {
    console.error('Error creating portfolio image:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio image' },
      { status: 500 }
    );
  }
}

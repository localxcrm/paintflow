import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/reviews - Get reviews with optional filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const jobId = searchParams.get('jobId');
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : null;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('Review')
      .select('*, job:Job(jobNumber, clientName)')
      .order('reviewDate', { ascending: false })
      .range(offset, offset + limit - 1);

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (jobId) {
      query = query.eq('jobId', jobId);
    }

    if (rating) {
      query = query.eq('rating', rating);
    }

    if (startDate) {
      query = query.gte('reviewDate', startDate);
    }

    if (endDate) {
      query = query.lte('reviewDate', endDate);
    }

    const { data: reviews, error } = await query;
    if (error) throw error;

    // Get total count
    const { count: total } = await supabase
      .from('Review')
      .select('*', { count: 'exact', head: true });

    // Calculate stats
    const allReviews = reviews || [];
    const totalReviews = allReviews.length;
    const avgRating = totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
    const fiveStarCount = allReviews.filter(r => r.rating === 5).length;
    const fiveStarPct = totalReviews > 0 ? (fiveStarCount / totalReviews) * 100 : 0;

    // Calculate distribution
    const distribution = allReviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return NextResponse.json({
      reviews: reviews || [],
      total: total || 0,
      limit,
      offset,
      stats: {
        averageRating: avgRating,
        totalReviews: total || 0,
        fiveStarCount,
        fiveStarPct,
        distribution,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data: review, error } = await supabase
      .from('Review')
      .insert({
        rating: body.rating,
        platform: body.platform || 'google',
        reviewText: body.reviewText,
        reviewerName: body.reviewerName,
        reviewDate: body.reviewDate || new Date().toISOString(),
        isVerified: body.isVerified ?? false,
        jobId: body.jobId,
      })
      .select('*, job:Job(jobNumber, clientName)')
      .single();

    if (error) throw error;

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

// PUT /api/reviews - Update a review
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const { data: review, error } = await supabase
      .from('Review')
      .update({
        rating: body.rating,
        platform: body.platform,
        reviewText: body.reviewText,
        reviewerName: body.reviewerName,
        reviewDate: body.reviewDate,
        isVerified: body.isVerified,
        jobId: body.jobId,
      })
      .eq('id', body.id)
      .select('*, job:Job(jobNumber, clientName)')
      .single();

    if (error) throw error;

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews - Delete a review
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('Review')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}

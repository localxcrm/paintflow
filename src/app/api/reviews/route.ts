import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/reviews - Get reviews with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const jobId = searchParams.get('jobId');
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : null;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};

    if (platform) {
      where.platform = platform;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (rating) {
      where.rating = rating;
    }

    if (startDate || endDate) {
      where.reviewDate = {};
      if (startDate) {
        (where.reviewDate as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.reviewDate as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          job: {
            select: {
              jobNumber: true,
              clientName: true,
            },
          },
        },
        orderBy: { reviewDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where,
      _count: { rating: true },
    });

    const distribution = ratingDistribution.reduce((acc, item) => {
      acc[item.rating] = item._count.rating;
      return acc;
    }, {} as Record<number, number>);

    // Calculate 5-star percentage
    const fiveStarCount = distribution[5] || 0;
    const fiveStarPct = total > 0 ? (fiveStarCount / total) * 100 : 0;

    return NextResponse.json({
      reviews,
      total,
      limit,
      offset,
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
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
    const body = await request.json();

    const review = await prisma.review.create({
      data: {
        rating: body.rating,
        platform: body.platform || 'google',
        reviewText: body.reviewText,
        reviewerName: body.reviewerName,
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : new Date(),
        isVerified: body.isVerified ?? false,
        jobId: body.jobId,
      },
      include: {
        job: {
          select: {
            jobNumber: true,
            clientName: true,
          },
        },
      },
    });

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
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const review = await prisma.review.update({
      where: { id: body.id },
      data: {
        rating: body.rating,
        platform: body.platform,
        reviewText: body.reviewText,
        reviewerName: body.reviewerName,
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
        isVerified: body.isVerified,
        jobId: body.jobId,
      },
      include: {
        job: {
          select: {
            jobNumber: true,
            clientName: true,
          },
        },
      },
    });

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}

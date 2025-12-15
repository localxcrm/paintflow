import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/scorecard - Get all scorecard metrics with entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const category = searchParams.get('category');
    const weeksBack = parseInt(searchParams.get('weeksBack') || '13');

    const where: Record<string, unknown> = {};

    if (owner) {
      where.owner = owner;
    }

    if (category) {
      where.category = category;
    }

    // Calculate the date range for entries
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeksBack * 7);

    const metrics = await prisma.scorecardMetric.findMany({
      where,
      include: {
        entries: {
          where: {
            weekEndingDate: {
              gte: startDate,
            },
          },
          orderBy: { weekEndingDate: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching scorecard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scorecard' },
      { status: 500 }
    );
  }
}

// POST /api/traction/scorecard - Create a new scorecard metric
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const metric = await prisma.scorecardMetric.create({
      data: {
        name: body.name,
        owner: body.owner,
        goalValue: body.goalValue,
        goalType: body.goalType || 'number',
        goalDirection: body.goalDirection || 'above',
        category: body.category || 'leading',
      },
      include: {
        entries: true,
      },
    });

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error('Error creating scorecard metric:', error);
    return NextResponse.json(
      { error: 'Failed to create scorecard metric' },
      { status: 500 }
    );
  }
}

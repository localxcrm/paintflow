import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/traction/scorecard/[id]/entries - Add an entry to a scorecard metric
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get the metric to check goal
    const metric = await prisma.scorecardMetric.findUnique({
      where: { id },
    });

    if (!metric) {
      return NextResponse.json(
        { error: 'Scorecard metric not found' },
        { status: 404 }
      );
    }

    // Determine if on track
    const actualValue = body.actualValue;
    let onTrack = false;

    if (metric.goalDirection === 'above') {
      onTrack = actualValue >= metric.goalValue;
    } else {
      onTrack = actualValue <= metric.goalValue;
    }

    const entry = await prisma.scorecardEntry.upsert({
      where: {
        metricId_weekEndingDate: {
          metricId: id,
          weekEndingDate: new Date(body.weekEndingDate),
        },
      },
      update: {
        actualValue,
        onTrack,
      },
      create: {
        metricId: id,
        weekEndingDate: new Date(body.weekEndingDate),
        actualValue,
        onTrack,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error adding scorecard entry:', error);
    return NextResponse.json(
      { error: 'Failed to add scorecard entry' },
      { status: 500 }
    );
  }
}

// GET /api/traction/scorecard/[id]/entries - Get entries for a scorecard metric
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const weeksBack = parseInt(searchParams.get('weeksBack') || '13');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeksBack * 7);

    const entries = await prisma.scorecardEntry.findMany({
      where: {
        metricId: id,
        weekEndingDate: {
          gte: startDate,
        },
      },
      orderBy: { weekEndingDate: 'desc' },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching scorecard entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scorecard entries' },
      { status: 500 }
    );
  }
}

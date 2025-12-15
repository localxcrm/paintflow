import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/scorecard/[id] - Get a single scorecard metric
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

    const metric = await prisma.scorecardMetric.findUnique({
      where: { id },
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
    });

    if (!metric) {
      return NextResponse.json(
        { error: 'Scorecard metric not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Error fetching scorecard metric:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scorecard metric' },
      { status: 500 }
    );
  }
}

// PATCH /api/traction/scorecard/[id] - Update a scorecard metric
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const metric = await prisma.scorecardMetric.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.owner !== undefined && { owner: body.owner }),
        ...(body.goalValue !== undefined && { goalValue: body.goalValue }),
        ...(body.goalType !== undefined && { goalType: body.goalType }),
        ...(body.goalDirection !== undefined && { goalDirection: body.goalDirection }),
        ...(body.category !== undefined && { category: body.category }),
      },
      include: {
        entries: {
          orderBy: { weekEndingDate: 'desc' },
          take: 13,
        },
      },
    });

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Error updating scorecard metric:', error);
    return NextResponse.json(
      { error: 'Failed to update scorecard metric' },
      { status: 500 }
    );
  }
}

// DELETE /api/traction/scorecard/[id] - Delete a scorecard metric
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.scorecardMetric.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scorecard metric:', error);
    return NextResponse.json(
      { error: 'Failed to delete scorecard metric' },
      { status: 500 }
    );
  }
}

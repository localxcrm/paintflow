import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/people-analyzer/[id] - Get a single people analyzer record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await prisma.peopleAnalyzer.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { error: 'People analyzer record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching people analyzer record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people analyzer record' },
      { status: 500 }
    );
  }
}

// PATCH /api/traction/people-analyzer/[id] - Update a people analyzer record
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const record = await prisma.peopleAnalyzer.update({
      where: { id },
      data: {
        ...(body.personName !== undefined && { personName: body.personName }),
        ...(body.reviewDate !== undefined && { reviewDate: new Date(body.reviewDate) }),
        ...(body.coreValueRatings !== undefined && { coreValueRatings: body.coreValueRatings }),
        ...(body.gwcGetsIt !== undefined && { gwcGetsIt: body.gwcGetsIt }),
        ...(body.gwcWantsIt !== undefined && { gwcWantsIt: body.gwcWantsIt }),
        ...(body.gwcCapacity !== undefined && { gwcCapacity: body.gwcCapacity }),
        ...(body.overallStatus !== undefined && { overallStatus: body.overallStatus }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating people analyzer record:', error);
    return NextResponse.json(
      { error: 'Failed to update people analyzer record' },
      { status: 500 }
    );
  }
}

// DELETE /api/traction/people-analyzer/[id] - Delete a people analyzer record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.peopleAnalyzer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting people analyzer record:', error);
    return NextResponse.json(
      { error: 'Failed to delete people analyzer record' },
      { status: 500 }
    );
  }
}

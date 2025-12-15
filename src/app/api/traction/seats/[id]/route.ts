import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/seats/[id] - Get a single seat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const seat = await prisma.seat.findUnique({
      where: { id },
      include: {
        reportsTo: true,
        directReports: true,
      },
    });

    if (!seat) {
      return NextResponse.json(
        { error: 'Seat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(seat);
  } catch (error) {
    console.error('Error fetching seat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seat' },
      { status: 500 }
    );
  }
}

// PATCH /api/traction/seats/[id] - Update a seat
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const seat = await prisma.seat.update({
      where: { id },
      data: {
        ...(body.seatName !== undefined && { seatName: body.seatName }),
        ...(body.roleDescription !== undefined && { roleDescription: body.roleDescription }),
        ...(body.responsibilities !== undefined && { responsibilities: body.responsibilities }),
        ...(body.personName !== undefined && { personName: body.personName }),
        ...(body.personId !== undefined && { personId: body.personId }),
        ...(body.reportsToId !== undefined && { reportsToId: body.reportsToId }),
        ...(body.gwcGetsIt !== undefined && { gwcGetsIt: body.gwcGetsIt }),
        ...(body.gwcWantsIt !== undefined && { gwcWantsIt: body.gwcWantsIt }),
        ...(body.gwcCapacity !== undefined && { gwcCapacity: body.gwcCapacity }),
        ...(body.isRightPersonRightSeat !== undefined && { isRightPersonRightSeat: body.isRightPersonRightSeat }),
      },
      include: {
        reportsTo: true,
        directReports: true,
      },
    });

    return NextResponse.json(seat);
  } catch (error) {
    console.error('Error updating seat:', error);
    return NextResponse.json(
      { error: 'Failed to update seat' },
      { status: 500 }
    );
  }
}

// DELETE /api/traction/seats/[id] - Delete a seat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.seat.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting seat:', error);
    return NextResponse.json(
      { error: 'Failed to delete seat' },
      { status: 500 }
    );
  }
}

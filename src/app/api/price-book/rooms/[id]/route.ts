import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/price-book/rooms/[id] - Get a single room price
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const roomPrice = await prisma.roomPrice.findUnique({
      where: { id },
    });

    if (!roomPrice) {
      return NextResponse.json(
        { error: 'Room price not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(roomPrice);
  } catch (error) {
    console.error('Error fetching room price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room price' },
      { status: 500 }
    );
  }
}

// PATCH /api/price-book/rooms/[id] - Update a room price
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const roomPrice = await prisma.roomPrice.update({
      where: { id },
      data: {
        ...(body.roomType !== undefined && { roomType: body.roomType }),
        ...(body.size !== undefined && { size: body.size }),
        ...(body.typicalSqft !== undefined && { typicalSqft: body.typicalSqft }),
        ...(body.wallsOnly !== undefined && { wallsOnly: body.wallsOnly }),
        ...(body.wallsTrim !== undefined && { wallsTrim: body.wallsTrim }),
        ...(body.wallsTrimCeiling !== undefined && { wallsTrimCeiling: body.wallsTrimCeiling }),
        ...(body.fullRefresh !== undefined && { fullRefresh: body.fullRefresh }),
      },
    });

    return NextResponse.json(roomPrice);
  } catch (error) {
    console.error('Error updating room price:', error);
    return NextResponse.json(
      { error: 'Failed to update room price' },
      { status: 500 }
    );
  }
}

// DELETE /api/price-book/rooms/[id] - Delete a room price
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.roomPrice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting room price:', error);
    return NextResponse.json(
      { error: 'Failed to delete room price' },
      { status: 500 }
    );
  }
}

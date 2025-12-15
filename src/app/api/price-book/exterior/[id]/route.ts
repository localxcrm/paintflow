import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/price-book/exterior/[id] - Get a single exterior price
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const exteriorPrice = await prisma.exteriorPrice.findUnique({
      where: { id },
    });

    if (!exteriorPrice) {
      return NextResponse.json(
        { error: 'Exterior price not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exteriorPrice);
  } catch (error) {
    console.error('Error fetching exterior price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exterior price' },
      { status: 500 }
    );
  }
}

// PATCH /api/price-book/exterior/[id] - Update an exterior price
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const exteriorPrice = await prisma.exteriorPrice.update({
      where: { id },
      data: {
        ...(body.surfaceType !== undefined && { surfaceType: body.surfaceType }),
        ...(body.pricePerSqft !== undefined && { pricePerSqft: body.pricePerSqft }),
        ...(body.prepMultiplier !== undefined && { prepMultiplier: body.prepMultiplier }),
      },
    });

    return NextResponse.json(exteriorPrice);
  } catch (error) {
    console.error('Error updating exterior price:', error);
    return NextResponse.json(
      { error: 'Failed to update exterior price' },
      { status: 500 }
    );
  }
}

// DELETE /api/price-book/exterior/[id] - Delete an exterior price
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.exteriorPrice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exterior price:', error);
    return NextResponse.json(
      { error: 'Failed to delete exterior price' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/price-book/rooms - Get all room prices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomType = searchParams.get('roomType');
    const size = searchParams.get('size');

    const where: Record<string, unknown> = {};

    if (roomType) {
      where.roomType = roomType;
    }

    if (size) {
      where.size = size;
    }

    const roomPrices = await prisma.roomPrice.findMany({
      where,
      orderBy: [{ roomType: 'asc' }, { size: 'asc' }],
    });

    return NextResponse.json(roomPrices);
  } catch (error) {
    console.error('Error fetching room prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room prices' },
      { status: 500 }
    );
  }
}

// POST /api/price-book/rooms - Create a new room price
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const roomPrice = await prisma.roomPrice.create({
      data: {
        roomType: body.roomType,
        size: body.size,
        typicalSqft: body.typicalSqft,
        wallsOnly: body.wallsOnly,
        wallsTrim: body.wallsTrim,
        wallsTrimCeiling: body.wallsTrimCeiling,
        fullRefresh: body.fullRefresh,
      },
    });

    return NextResponse.json(roomPrice, { status: 201 });
  } catch (error) {
    console.error('Error creating room price:', error);
    return NextResponse.json(
      { error: 'Failed to create room price' },
      { status: 500 }
    );
  }
}

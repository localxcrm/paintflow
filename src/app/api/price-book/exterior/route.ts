import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/price-book/exterior - Get all exterior prices
export async function GET() {
  try {
    const exteriorPrices = await prisma.exteriorPrice.findMany({
      orderBy: { surfaceType: 'asc' },
    });

    return NextResponse.json(exteriorPrices);
  } catch (error) {
    console.error('Error fetching exterior prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exterior prices' },
      { status: 500 }
    );
  }
}

// POST /api/price-book/exterior - Create a new exterior price
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const exteriorPrice = await prisma.exteriorPrice.create({
      data: {
        surfaceType: body.surfaceType,
        pricePerSqft: body.pricePerSqft,
        prepMultiplier: body.prepMultiplier || 1.0,
      },
    });

    return NextResponse.json(exteriorPrice, { status: 201 });
  } catch (error) {
    console.error('Error creating exterior price:', error);
    return NextResponse.json(
      { error: 'Failed to create exterior price' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/price-book/addons - Get all addons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    const addons = await prisma.addon.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(addons);
  } catch (error) {
    console.error('Error fetching addons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addons' },
      { status: 500 }
    );
  }
}

// POST /api/price-book/addons - Create a new addon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const addon = await prisma.addon.create({
      data: {
        name: body.name,
        category: body.category || 'both',
        unit: body.unit,
        basePrice: body.basePrice,
      },
    });

    return NextResponse.json(addon, { status: 201 });
  } catch (error) {
    console.error('Error creating addon:', error);
    return NextResponse.json(
      { error: 'Failed to create addon' },
      { status: 500 }
    );
  }
}

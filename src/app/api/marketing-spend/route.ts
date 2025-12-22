import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/marketing-spend - Get marketing spend with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const source = searchParams.get('source');

    const where: Record<string, unknown> = { year };

    if (month) {
      where.month = month;
    }

    if (source) {
      where.source = source;
    }

    const [spends, totals] = await Promise.all([
      prisma.marketingSpend.findMany({
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { source: 'asc' }],
      }),
      prisma.marketingSpend.groupBy({
        by: ['source'],
        where: { year },
        _sum: { amount: true },
      }),
    ]);

    // Calculate totals
    const totalBySource = totals.reduce((acc, item) => {
      acc[item.source] = item._sum.amount || 0;
      return acc;
    }, {} as Record<string, number>);

    const grandTotal = Object.values(totalBySource).reduce((sum, val) => sum + val, 0);

    return NextResponse.json({
      spends,
      totalBySource,
      grandTotal,
      year,
    });
  } catch (error) {
    console.error('Error fetching marketing spend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketing spend' },
      { status: 500 }
    );
  }
}

// POST /api/marketing-spend - Create or update marketing spend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const spend = await prisma.marketingSpend.upsert({
      where: {
        month_year_source: {
          month: body.month,
          year: body.year,
          source: body.source,
        },
      },
      update: {
        amount: body.amount,
        notes: body.notes,
      },
      create: {
        source: body.source,
        amount: body.amount,
        month: body.month,
        year: body.year,
        notes: body.notes,
      },
    });

    return NextResponse.json(spend, { status: 201 });
  } catch (error) {
    console.error('Error saving marketing spend:', error);
    return NextResponse.json(
      { error: 'Failed to save marketing spend' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketing-spend - Delete marketing spend
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await prisma.marketingSpend.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting marketing spend:', error);
    return NextResponse.json(
      { error: 'Failed to delete marketing spend' },
      { status: 500 }
    );
  }
}

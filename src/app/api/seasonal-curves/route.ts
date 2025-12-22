import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Default seasonal weights based on painting industry patterns
const DEFAULT_WEIGHTS = {
  1: 0.053,  // January
  2: 0.063,  // February
  3: 0.095,  // March
  4: 0.101,  // April
  5: 0.106,  // May
  6: 0.095,  // June
  7: 0.090,  // July
  8: 0.079,  // August
  9: 0.079,  // September
  10: 0.090, // October
  11: 0.085, // November
  12: 0.063, // December
};

// GET /api/seasonal-curves - Get seasonal curves
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const metric = searchParams.get('metric');

    const where: Record<string, unknown> = { year };

    if (metric) {
      where.metric = metric;
    }

    const curves = await prisma.seasonalCurve.findMany({
      where,
      orderBy: [{ metric: 'asc' }, { month: 'asc' }],
    });

    // Group by metric
    const curvesByMetric = curves.reduce((acc, curve) => {
      if (!acc[curve.metric]) {
        acc[curve.metric] = [];
      }
      acc[curve.metric].push(curve);
      return acc;
    }, {} as Record<string, typeof curves>);

    return NextResponse.json({
      curves,
      curvesByMetric,
      year,
    });
  } catch (error) {
    console.error('Error fetching seasonal curves:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seasonal curves' },
      { status: 500 }
    );
  }
}

// POST /api/seasonal-curves - Create or update seasonal curve
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const curve = await prisma.seasonalCurve.upsert({
      where: {
        month_year_metric: {
          month: body.month,
          year: body.year,
          metric: body.metric,
        },
      },
      update: {
        weight: body.weight,
      },
      create: {
        month: body.month,
        year: body.year,
        metric: body.metric,
        weight: body.weight,
      },
    });

    return NextResponse.json(curve, { status: 201 });
  } catch (error) {
    console.error('Error saving seasonal curve:', error);
    return NextResponse.json(
      { error: 'Failed to save seasonal curve' },
      { status: 500 }
    );
  }
}

// PUT /api/seasonal-curves - Initialize default curves for a year
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, metrics = ['leads', 'sales', 'revenue'] } = body;

    const createdCurves = [];

    for (const metric of metrics) {
      for (let month = 1; month <= 12; month++) {
        const curve = await prisma.seasonalCurve.upsert({
          where: {
            month_year_metric: { month, year, metric },
          },
          update: {},
          create: {
            month,
            year,
            metric,
            weight: DEFAULT_WEIGHTS[month as keyof typeof DEFAULT_WEIGHTS],
          },
        });
        createdCurves.push(curve);
      }
    }

    return NextResponse.json({
      message: 'Seasonal curves initialized successfully',
      curves: createdCurves,
    });
  } catch (error) {
    console.error('Error initializing seasonal curves:', error);
    return NextResponse.json(
      { error: 'Failed to initialize seasonal curves' },
      { status: 500 }
    );
  }
}

// DELETE /api/seasonal-curves - Delete a seasonal curve
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

    await prisma.seasonalCurve.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting seasonal curve:', error);
    return NextResponse.json(
      { error: 'Failed to delete seasonal curve' },
      { status: 500 }
    );
  }
}

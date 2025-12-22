import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/targets - Get targets (daily or monthly)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'monthly'; // 'daily' or 'monthly'
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (type === 'daily') {
      const where: Record<string, unknown> = {};

      if (startDate && endDate) {
        where.date = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      } else if (month) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        where.date = {
          gte: start,
          lte: end,
        };
      }

      const dailyTargets = await prisma.dailyTarget.findMany({
        where,
        orderBy: { date: 'asc' },
      });

      // Calculate cumulative totals
      let cumulativeGoals = {
        leads: 0,
        appointments: 0,
        sales: 0,
        salesValue: 0,
        revenue: 0,
        reviews: 0,
      };

      let cumulativeActuals = {
        leads: 0,
        appointments: 0,
        sales: 0,
        salesValue: 0,
        revenue: 0,
        reviews: 0,
      };

      const targetsWithCumulative = dailyTargets.map((target) => {
        cumulativeGoals = {
          leads: cumulativeGoals.leads + target.leadsGoal,
          appointments: cumulativeGoals.appointments + target.appointmentsGoal,
          sales: cumulativeGoals.sales + target.salesGoal,
          salesValue: cumulativeGoals.salesValue + target.salesValueGoal,
          revenue: cumulativeGoals.revenue + target.revenueGoal,
          reviews: cumulativeGoals.reviews + target.reviewsGoal,
        };

        cumulativeActuals = {
          leads: cumulativeActuals.leads + target.leadsActual,
          appointments: cumulativeActuals.appointments + target.appointmentsActual,
          sales: cumulativeActuals.sales + target.salesActual,
          salesValue: cumulativeActuals.salesValue + target.salesValueActual,
          revenue: cumulativeActuals.revenue + target.revenueActual,
          reviews: cumulativeActuals.reviews + target.reviewsActual,
        };

        return {
          ...target,
          cumulativeGoals: { ...cumulativeGoals },
          cumulativeActuals: { ...cumulativeActuals },
        };
      });

      return NextResponse.json({
        type: 'daily',
        targets: targetsWithCumulative,
        totals: {
          goals: cumulativeGoals,
          actuals: cumulativeActuals,
        },
      });
    } else {
      // Monthly targets
      const where: Record<string, unknown> = { year };

      if (month) {
        where.month = month;
      }

      const monthlyTargets = await prisma.monthlyTarget.findMany({
        where,
        orderBy: { month: 'asc' },
      });

      // Calculate yearly totals
      const yearlyTotals = monthlyTargets.reduce(
        (acc, target) => ({
          leadsGoal: acc.leadsGoal + target.leadsGoal,
          leadsActual: acc.leadsActual + target.leadsActual,
          appointmentsGoal: acc.appointmentsGoal + target.appointmentsGoal,
          appointmentsActual: acc.appointmentsActual + target.appointmentsActual,
          salesGoal: acc.salesGoal + target.salesGoal,
          salesActual: acc.salesActual + target.salesActual,
          salesValueGoal: acc.salesValueGoal + target.salesValueGoal,
          salesValueActual: acc.salesValueActual + target.salesValueActual,
          revenueGoal: acc.revenueGoal + target.revenueGoal,
          revenueActual: acc.revenueActual + target.revenueActual,
          grossProfitGoal: acc.grossProfitGoal + target.grossProfitGoal,
          grossProfitActual: acc.grossProfitActual + target.grossProfitActual,
          reviewsGoal: acc.reviewsGoal + target.reviewsGoal,
          reviewsActual: acc.reviewsActual + target.reviewsActual,
          marketingSpendGoal: acc.marketingSpendGoal + target.marketingSpendGoal,
          marketingSpendActual: acc.marketingSpendActual + target.marketingSpendActual,
        }),
        {
          leadsGoal: 0,
          leadsActual: 0,
          appointmentsGoal: 0,
          appointmentsActual: 0,
          salesGoal: 0,
          salesActual: 0,
          salesValueGoal: 0,
          salesValueActual: 0,
          revenueGoal: 0,
          revenueActual: 0,
          grossProfitGoal: 0,
          grossProfitActual: 0,
          reviewsGoal: 0,
          reviewsActual: 0,
          marketingSpendGoal: 0,
          marketingSpendActual: 0,
        }
      );

      return NextResponse.json({
        type: 'monthly',
        targets: monthlyTargets,
        yearlyTotals,
        year,
      });
    }
  } catch (error) {
    console.error('Error fetching targets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch targets' },
      { status: 500 }
    );
  }
}

// POST /api/targets - Create or update targets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type || 'monthly';

    if (type === 'daily') {
      const target = await prisma.dailyTarget.upsert({
        where: {
          date: new Date(body.date),
        },
        update: {
          dayWeight: body.dayWeight,
          isHoliday: body.isHoliday,
          holidayName: body.holidayName,
          leadsGoal: body.leadsGoal,
          appointmentsGoal: body.appointmentsGoal,
          salesGoal: body.salesGoal,
          salesValueGoal: body.salesValueGoal,
          revenueGoal: body.revenueGoal,
          reviewsGoal: body.reviewsGoal,
          leadsActual: body.leadsActual,
          appointmentsActual: body.appointmentsActual,
          salesActual: body.salesActual,
          salesValueActual: body.salesValueActual,
          revenueActual: body.revenueActual,
          reviewsActual: body.reviewsActual,
        },
        create: {
          date: new Date(body.date),
          dayWeight: body.dayWeight ?? 1,
          isHoliday: body.isHoliday ?? false,
          holidayName: body.holidayName,
          leadsGoal: body.leadsGoal ?? 0,
          appointmentsGoal: body.appointmentsGoal ?? 0,
          salesGoal: body.salesGoal ?? 0,
          salesValueGoal: body.salesValueGoal ?? 0,
          revenueGoal: body.revenueGoal ?? 0,
          reviewsGoal: body.reviewsGoal ?? 0,
          leadsActual: body.leadsActual ?? 0,
          appointmentsActual: body.appointmentsActual ?? 0,
          salesActual: body.salesActual ?? 0,
          salesValueActual: body.salesValueActual ?? 0,
          revenueActual: body.revenueActual ?? 0,
          reviewsActual: body.reviewsActual ?? 0,
        },
      });

      return NextResponse.json(target, { status: 201 });
    } else {
      const quarter = Math.ceil(body.month / 3);

      const target = await prisma.monthlyTarget.upsert({
        where: {
          month_year: {
            month: body.month,
            year: body.year,
          },
        },
        update: {
          quarter,
          leadsGoal: body.leadsGoal,
          appointmentsGoal: body.appointmentsGoal,
          salesGoal: body.salesGoal,
          salesValueGoal: body.salesValueGoal,
          revenueGoal: body.revenueGoal,
          grossProfitGoal: body.grossProfitGoal,
          reviewsGoal: body.reviewsGoal,
          marketingSpendGoal: body.marketingSpendGoal,
          leadsActual: body.leadsActual,
          appointmentsActual: body.appointmentsActual,
          salesActual: body.salesActual,
          salesValueActual: body.salesValueActual,
          revenueActual: body.revenueActual,
          grossProfitActual: body.grossProfitActual,
          reviewsActual: body.reviewsActual,
          marketingSpendActual: body.marketingSpendActual,
        },
        create: {
          month: body.month,
          year: body.year,
          quarter,
          leadsGoal: body.leadsGoal ?? 0,
          appointmentsGoal: body.appointmentsGoal ?? 0,
          salesGoal: body.salesGoal ?? 0,
          salesValueGoal: body.salesValueGoal ?? 0,
          revenueGoal: body.revenueGoal ?? 0,
          grossProfitGoal: body.grossProfitGoal ?? 0,
          reviewsGoal: body.reviewsGoal ?? 0,
          marketingSpendGoal: body.marketingSpendGoal ?? 0,
          leadsActual: body.leadsActual ?? 0,
          appointmentsActual: body.appointmentsActual ?? 0,
          salesActual: body.salesActual ?? 0,
          salesValueActual: body.salesValueActual ?? 0,
          revenueActual: body.revenueActual ?? 0,
          grossProfitActual: body.grossProfitActual ?? 0,
          reviewsActual: body.reviewsActual ?? 0,
          marketingSpendActual: body.marketingSpendActual ?? 0,
        },
      });

      return NextResponse.json(target, { status: 201 });
    }
  } catch (error) {
    console.error('Error saving target:', error);
    return NextResponse.json(
      { error: 'Failed to save target' },
      { status: 500 }
    );
  }
}

// PUT /api/targets/generate - Generate targets from seasonal curves
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, annualGoals } = body;

    // Get seasonal curves for the year
    const curves = await prisma.seasonalCurve.findMany({
      where: { year },
    });

    if (curves.length === 0) {
      return NextResponse.json(
        { error: 'No seasonal curves defined for this year' },
        { status: 400 }
      );
    }

    // Group curves by metric
    const curvesByMetric = curves.reduce((acc, curve) => {
      if (!acc[curve.metric]) {
        acc[curve.metric] = {};
      }
      acc[curve.metric][curve.month] = curve.weight;
      return acc;
    }, {} as Record<string, Record<number, number>>);

    // Generate monthly targets
    const monthlyTargets = [];
    for (let month = 1; month <= 12; month++) {
      const quarter = Math.ceil(month / 3);

      const target = await prisma.monthlyTarget.upsert({
        where: {
          month_year: { month, year },
        },
        update: {
          quarter,
          leadsGoal: Math.round((annualGoals.leads || 0) * (curvesByMetric.leads?.[month] || 1 / 12)),
          salesGoal: Math.round((annualGoals.sales || 0) * (curvesByMetric.sales?.[month] || 1 / 12)),
          revenueGoal: Math.round((annualGoals.revenue || 0) * (curvesByMetric.revenue?.[month] || 1 / 12)),
          grossProfitGoal: Math.round((annualGoals.grossProfit || 0) * (curvesByMetric.revenue?.[month] || 1 / 12)),
          reviewsGoal: Math.round((annualGoals.reviews || 0) * (curvesByMetric.sales?.[month] || 1 / 12)),
          marketingSpendGoal: Math.round((annualGoals.marketingSpend || 0) / 12),
        },
        create: {
          month,
          year,
          quarter,
          leadsGoal: Math.round((annualGoals.leads || 0) * (curvesByMetric.leads?.[month] || 1 / 12)),
          salesGoal: Math.round((annualGoals.sales || 0) * (curvesByMetric.sales?.[month] || 1 / 12)),
          revenueGoal: Math.round((annualGoals.revenue || 0) * (curvesByMetric.revenue?.[month] || 1 / 12)),
          grossProfitGoal: Math.round((annualGoals.grossProfit || 0) * (curvesByMetric.revenue?.[month] || 1 / 12)),
          reviewsGoal: Math.round((annualGoals.reviews || 0) * (curvesByMetric.sales?.[month] || 1 / 12)),
          marketingSpendGoal: Math.round((annualGoals.marketingSpend || 0) / 12),
        },
      });

      monthlyTargets.push(target);
    }

    return NextResponse.json({
      message: 'Monthly targets generated successfully',
      targets: monthlyTargets,
    });
  } catch (error) {
    console.error('Error generating targets:', error);
    return NextResponse.json(
      { error: 'Failed to generate targets' },
      { status: 500 }
    );
  }
}

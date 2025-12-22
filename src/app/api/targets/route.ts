import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/targets - Get targets (daily or monthly)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'monthly';
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (type === 'daily') {
      let query = supabase
        .from('DailyTarget')
        .select('*')
        .order('date', { ascending: true });

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      } else if (month) {
        const start = new Date(year, month - 1, 1).toISOString();
        const end = new Date(year, month, 0).toISOString();
        query = query.gte('date', start).lte('date', end);
      }

      const { data: dailyTargets, error } = await query;
      if (error) throw error;

      // Calculate cumulative totals
      let cumulativeGoals = { leads: 0, appointments: 0, sales: 0, salesValue: 0, revenue: 0, reviews: 0 };
      let cumulativeActuals = { leads: 0, appointments: 0, sales: 0, salesValue: 0, revenue: 0, reviews: 0 };

      const targetsWithCumulative = (dailyTargets || []).map((target) => {
        cumulativeGoals = {
          leads: cumulativeGoals.leads + (target.leadsGoal || 0),
          appointments: cumulativeGoals.appointments + (target.appointmentsGoal || 0),
          sales: cumulativeGoals.sales + (target.salesGoal || 0),
          salesValue: cumulativeGoals.salesValue + (target.salesValueGoal || 0),
          revenue: cumulativeGoals.revenue + (target.revenueGoal || 0),
          reviews: cumulativeGoals.reviews + (target.reviewsGoal || 0),
        };

        cumulativeActuals = {
          leads: cumulativeActuals.leads + (target.leadsActual || 0),
          appointments: cumulativeActuals.appointments + (target.appointmentsActual || 0),
          sales: cumulativeActuals.sales + (target.salesActual || 0),
          salesValue: cumulativeActuals.salesValue + (target.salesValueActual || 0),
          revenue: cumulativeActuals.revenue + (target.revenueActual || 0),
          reviews: cumulativeActuals.reviews + (target.reviewsActual || 0),
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
      let query = supabase
        .from('MonthlyTarget')
        .select('*')
        .eq('year', year)
        .order('month', { ascending: true });

      if (month) {
        query = query.eq('month', month);
      }

      const { data: monthlyTargets, error } = await query;
      if (error) throw error;

      // Calculate yearly totals
      const yearlyTotals = (monthlyTargets || []).reduce(
        (acc, target) => ({
          leadsGoal: acc.leadsGoal + (target.leadsGoal || 0),
          leadsActual: acc.leadsActual + (target.leadsActual || 0),
          appointmentsGoal: acc.appointmentsGoal + (target.appointmentsGoal || 0),
          appointmentsActual: acc.appointmentsActual + (target.appointmentsActual || 0),
          salesGoal: acc.salesGoal + (target.salesGoal || 0),
          salesActual: acc.salesActual + (target.salesActual || 0),
          salesValueGoal: acc.salesValueGoal + (target.salesValueGoal || 0),
          salesValueActual: acc.salesValueActual + (target.salesValueActual || 0),
          revenueGoal: acc.revenueGoal + (target.revenueGoal || 0),
          revenueActual: acc.revenueActual + (target.revenueActual || 0),
          grossProfitGoal: acc.grossProfitGoal + (target.grossProfitGoal || 0),
          grossProfitActual: acc.grossProfitActual + (target.grossProfitActual || 0),
          reviewsGoal: acc.reviewsGoal + (target.reviewsGoal || 0),
          reviewsActual: acc.reviewsActual + (target.reviewsActual || 0),
          marketingSpendGoal: acc.marketingSpendGoal + (target.marketingSpendGoal || 0),
          marketingSpendActual: acc.marketingSpendActual + (target.marketingSpendActual || 0),
        }),
        {
          leadsGoal: 0, leadsActual: 0, appointmentsGoal: 0, appointmentsActual: 0,
          salesGoal: 0, salesActual: 0, salesValueGoal: 0, salesValueActual: 0,
          revenueGoal: 0, revenueActual: 0, grossProfitGoal: 0, grossProfitActual: 0,
          reviewsGoal: 0, reviewsActual: 0, marketingSpendGoal: 0, marketingSpendActual: 0,
        }
      );

      return NextResponse.json({
        type: 'monthly',
        targets: monthlyTargets || [],
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
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const type = body.type || 'monthly';

    if (type === 'daily') {
      const { data: existing } = await supabase
        .from('DailyTarget')
        .select('id')
        .eq('date', body.date)
        .single();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('DailyTarget')
          .update({
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
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('DailyTarget')
          .insert({
            date: body.date,
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
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      return NextResponse.json(result, { status: 201 });
    } else {
      const quarter = Math.ceil(body.month / 3);

      const { data: existing } = await supabase
        .from('MonthlyTarget')
        .select('id')
        .eq('month', body.month)
        .eq('year', body.year)
        .single();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('MonthlyTarget')
          .update({
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
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('MonthlyTarget')
          .insert({
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
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      return NextResponse.json(result, { status: 201 });
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
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { year, annualGoals } = body;

    // Get seasonal curves for the year
    const { data: curves, error: curvesError } = await supabase
      .from('SeasonalCurve')
      .select('*')
      .eq('year', year);

    if (curvesError) throw curvesError;

    if (!curves || curves.length === 0) {
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

      const { data: existing } = await supabase
        .from('MonthlyTarget')
        .select('id')
        .eq('month', month)
        .eq('year', year)
        .single();

      const targetData = {
        quarter,
        leadsGoal: Math.round((annualGoals.leads || 0) * (curvesByMetric.leads?.[month] || 1 / 12)),
        salesGoal: Math.round((annualGoals.sales || 0) * (curvesByMetric.sales?.[month] || 1 / 12)),
        revenueGoal: Math.round((annualGoals.revenue || 0) * (curvesByMetric.revenue?.[month] || 1 / 12)),
        grossProfitGoal: Math.round((annualGoals.grossProfit || 0) * (curvesByMetric.revenue?.[month] || 1 / 12)),
        reviewsGoal: Math.round((annualGoals.reviews || 0) * (curvesByMetric.sales?.[month] || 1 / 12)),
        marketingSpendGoal: Math.round((annualGoals.marketingSpend || 0) / 12),
      };

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('MonthlyTarget')
          .update(targetData)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('MonthlyTarget')
          .insert({ month, year, ...targetData })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      monthlyTargets.push(result);
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

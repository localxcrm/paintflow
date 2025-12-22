// KPI Dashboard API
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getMtdKpi,
  getYtdKpi,
  calculateKpiWithTarget,
  getDailyTrend,
  getLeadsBySource,
  getMonthToDateRange,
  getYearToDateRange,
} from '@/lib/kpi';

// GET /api/kpi - Get KPI summary
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const period = searchParams.get('period') || 'mtd'; // mtd, ytd, custom
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeTrend = searchParams.get('includeTrend') === 'true';

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    let kpi;
    let dateRange;

    switch (period) {
      case 'ytd':
        kpi = await getYtdKpi(tenantId);
        dateRange = getYearToDateRange();
        break;

      case 'custom':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate required for custom period' },
            { status: 400 }
          );
        }
        dateRange = { start: new Date(startDate), end: new Date(endDate) };
        kpi = await calculateKpiWithTarget(tenantId, dateRange.start, dateRange.end, 'monthly');
        break;

      case 'mtd':
      default:
        kpi = await getMtdKpi(tenantId);
        dateRange = getMonthToDateRange();
        break;
    }

    // Get additional data if requested
    let trend = null;
    let leadsBySource = null;

    if (includeTrend) {
      trend = await getDailyTrend(tenantId, 30);
    }

    // Always include leads by source for the period
    leadsBySource = await getLeadsBySource(tenantId, dateRange.start, dateRange.end);

    return NextResponse.json({
      kpi,
      period,
      dateRange: {
        start: dateRange.start.toISOString().split('T')[0],
        end: dateRange.end.toISOString().split('T')[0],
      },
      trend,
      leadsBySource,
    });

  } catch (error) {
    console.error('[KPI] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}

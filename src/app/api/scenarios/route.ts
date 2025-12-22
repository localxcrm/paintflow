import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// Calculate scenario results
function calculateScenarioResults(scenario: {
  leadsCount: number;
  issueRate: number;
  closingRate: number;
  averageSale: number;
  markupRatio: number;
  marketingSpend: number;
  cogsLaborPct: number;
  cogsMaterialsPct: number;
  cogsOtherPct: number;
  salesCommissionPct: number;
  pmCommissionPct: number;
  ownerSalary: number;
  productionSalary: number;
  salesSalary: number;
  adminSalary: number;
  otherOverhead: number;
}) {
  const appointments = Math.round(scenario.leadsCount * scenario.issueRate);
  const sales = Math.round(appointments * scenario.closingRate);
  const revenue = sales * scenario.averageSale;

  // COGS
  const cogsLabor = revenue * scenario.cogsLaborPct;
  const cogsMaterials = revenue * scenario.cogsMaterialsPct;
  const cogsOther = revenue * scenario.cogsOtherPct;
  const totalCogs = cogsLabor + cogsMaterials + cogsOther;

  // Gross Profit
  const grossProfit = revenue - totalCogs;
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  // Commissions
  const salesCommission = revenue * scenario.salesCommissionPct;
  const pmCommission = revenue * scenario.pmCommissionPct;
  const totalCommissions = salesCommission + pmCommission;

  // Contribution Profit
  const contributionProfit = grossProfit - totalCommissions;

  // Overhead
  const totalOverhead =
    scenario.ownerSalary +
    scenario.productionSalary +
    scenario.salesSalary +
    scenario.adminSalary +
    scenario.otherOverhead;

  // Total Expenses
  const totalExpenses = totalCommissions + scenario.marketingSpend + totalOverhead;

  // Net Profit
  const netProfit = grossProfit - totalExpenses;
  const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // CPL & ROI
  const cpl = scenario.leadsCount > 0 ? scenario.marketingSpend / scenario.leadsCount : 0;
  const roi = scenario.marketingSpend > 0 ? revenue / scenario.marketingSpend : 0;

  // Owner Take Home (Net Profit + Owner Salary if positive)
  const ownerTakeHome = netProfit + scenario.ownerSalary;

  // NSLI (Net Sales per Lead)
  const nsli = scenario.leadsCount > 0 ? revenue / scenario.leadsCount : 0;

  return {
    appointments,
    sales,
    nsli,
    revenue,
    cogsLabor,
    cogsMaterials,
    cogsOther,
    totalCogs,
    grossProfit,
    grossMarginPct,
    contributionProfit,
    salesCommission,
    pmCommission,
    totalCommissions,
    totalOverhead,
    totalExpenses,
    netProfit,
    netMarginPct,
    cpl,
    roi,
    ownerTakeHome,
  };
}

// GET /api/scenarios - Get all scenarios
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const { data: scenario, error } = await supabase
        .from('Scenario')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!scenario) {
        return NextResponse.json(
          { error: 'Scenario not found' },
          { status: 404 }
        );
      }

      const results = calculateScenarioResults(scenario);

      return NextResponse.json({
        scenario,
        results,
      });
    }

    const { data: scenarios, error } = await supabase
      .from('Scenario')
      .select('*')
      .order('isBaseline', { ascending: false })
      .order('createdAt', { ascending: false });

    if (error) throw error;

    const scenariosWithResults = (scenarios || []).map((scenario) => ({
      ...scenario,
      results: calculateScenarioResults(scenario),
    }));

    return NextResponse.json({ scenarios: scenariosWithResults });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

// POST /api/scenarios - Create a new scenario
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // If this is a baseline, unset other baselines
    if (body.isBaseline) {
      await supabase
        .from('Scenario')
        .update({ isBaseline: false })
        .eq('isBaseline', true);
    }

    const results = calculateScenarioResults(body);

    const { data: scenario, error } = await supabase
      .from('Scenario')
      .insert({
        name: body.name,
        description: body.description,
        isBaseline: body.isBaseline ?? false,
        leadsCount: body.leadsCount ?? 0,
        issueRate: body.issueRate ?? 0.75,
        closingRate: body.closingRate ?? 0.4,
        averageSale: body.averageSale ?? 4000,
        markupRatio: body.markupRatio ?? 1.82,
        marketingSpend: body.marketingSpend ?? 0,
        cogsLaborPct: body.cogsLaborPct ?? 0.32,
        cogsMaterialsPct: body.cogsMaterialsPct ?? 0.21,
        cogsOtherPct: body.cogsOtherPct ?? 0.02,
        salesCommissionPct: body.salesCommissionPct ?? 0.10,
        pmCommissionPct: body.pmCommissionPct ?? 0.03,
        ownerSalary: body.ownerSalary ?? 0,
        productionSalary: body.productionSalary ?? 0,
        salesSalary: body.salesSalary ?? 0,
        adminSalary: body.adminSalary ?? 0,
        otherOverhead: body.otherOverhead ?? 0,
        calculatedRevenue: results.revenue,
        calculatedGrossProfit: results.grossProfit,
        calculatedNetProfit: results.netProfit,
        calculatedCPL: results.cpl,
        calculatedROI: results.roi,
        calculatedOwnerTakeHome: results.ownerTakeHome,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ scenario, results }, { status: 201 });
  } catch (error) {
    console.error('Error creating scenario:', error);
    return NextResponse.json(
      { error: 'Failed to create scenario' },
      { status: 500 }
    );
  }
}

// PUT /api/scenarios - Update a scenario
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // If this is a baseline, unset other baselines
    if (body.isBaseline) {
      await supabase
        .from('Scenario')
        .update({ isBaseline: false })
        .neq('id', body.id)
        .eq('isBaseline', true);
    }

    const results = calculateScenarioResults(body);

    const { data: scenario, error } = await supabase
      .from('Scenario')
      .update({
        name: body.name,
        description: body.description,
        isBaseline: body.isBaseline,
        leadsCount: body.leadsCount,
        issueRate: body.issueRate,
        closingRate: body.closingRate,
        averageSale: body.averageSale,
        markupRatio: body.markupRatio,
        marketingSpend: body.marketingSpend,
        cogsLaborPct: body.cogsLaborPct,
        cogsMaterialsPct: body.cogsMaterialsPct,
        cogsOtherPct: body.cogsOtherPct,
        salesCommissionPct: body.salesCommissionPct,
        pmCommissionPct: body.pmCommissionPct,
        ownerSalary: body.ownerSalary,
        productionSalary: body.productionSalary,
        salesSalary: body.salesSalary,
        adminSalary: body.adminSalary,
        otherOverhead: body.otherOverhead,
        calculatedRevenue: results.revenue,
        calculatedGrossProfit: results.grossProfit,
        calculatedNetProfit: results.netProfit,
        calculatedCPL: results.cpl,
        calculatedROI: results.roi,
        calculatedOwnerTakeHome: results.ownerTakeHome,
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ scenario, results });
  } catch (error) {
    console.error('Error updating scenario:', error);
    return NextResponse.json(
      { error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

// DELETE /api/scenarios - Delete a scenario
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('Scenario')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}

// PATCH /api/scenarios - Compare scenarios
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { baselineId, comparisonId } = body;

    const [baselineResult, comparisonResult] = await Promise.all([
      supabase.from('Scenario').select('*').eq('id', baselineId).single(),
      supabase.from('Scenario').select('*').eq('id', comparisonId).single(),
    ]);

    if (baselineResult.error || comparisonResult.error) {
      return NextResponse.json(
        { error: 'One or both scenarios not found' },
        { status: 404 }
      );
    }

    const baseline = baselineResult.data;
    const comparison = comparisonResult.data;

    const baselineResults = calculateScenarioResults(baseline);
    const comparisonResults = calculateScenarioResults(comparison);

    const differences = {
      revenue: comparisonResults.revenue - baselineResults.revenue,
      revenuePct: baselineResults.revenue > 0
        ? ((comparisonResults.revenue - baselineResults.revenue) / baselineResults.revenue) * 100
        : 0,
      grossProfit: comparisonResults.grossProfit - baselineResults.grossProfit,
      grossProfitPct: baselineResults.grossProfit > 0
        ? ((comparisonResults.grossProfit - baselineResults.grossProfit) / baselineResults.grossProfit) * 100
        : 0,
      netProfit: comparisonResults.netProfit - baselineResults.netProfit,
      netProfitPct: baselineResults.netProfit > 0
        ? ((comparisonResults.netProfit - baselineResults.netProfit) / baselineResults.netProfit) * 100
        : 0,
      ownerTakeHome: comparisonResults.ownerTakeHome - baselineResults.ownerTakeHome,
      ownerTakeHomePct: baselineResults.ownerTakeHome > 0
        ? ((comparisonResults.ownerTakeHome - baselineResults.ownerTakeHome) / baselineResults.ownerTakeHome) * 100
        : 0,
      cpl: comparisonResults.cpl - baselineResults.cpl,
      roi: comparisonResults.roi - baselineResults.roi,
    };

    return NextResponse.json({
      baseline: { scenario: baseline, results: baselineResults },
      comparison: { scenario: comparison, results: comparisonResults },
      differences,
    });
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to compare scenarios' },
      { status: 500 }
    );
  }
}

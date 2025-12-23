import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase';

// GET /api/vto - Get VTO data for organization
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: vto, error } = await supabase
      .from('VTO')
      .select('*')
      .eq('organizationId', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return default VTO if none exists
    if (!vto) {
      return NextResponse.json({
        id: null,
        organizationId,
        coreValues: [],
        coreFocus: { purpose: '', niche: '' },
        tenYearTarget: '',
        threeYearPicture: { revenue: '', profit: '', measurables: [] },
        oneYearPlan: { revenue: '', profit: '', goals: [] },
        quarterlyRocks: [],
        issuesList: [],
        annualTarget: 1000000,
        formulaParams: {
          avgTicket: 3500,
          closeRate: 0.35,
          showRate: 0.70,
          leadToEstimate: 0.85,
        },
      });
    }

    return NextResponse.json(vto);
  } catch (error) {
    console.error('Error fetching VTO:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VTO' },
      { status: 500 }
    );
  }
}

// POST /api/vto - Create or update VTO for organization
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Check if VTO exists for this organization
    const { data: existingVto } = await supabase
      .from('VTO')
      .select('id')
      .eq('organizationId', organizationId)
      .single();

    let result;

    if (existingVto) {
      // Update existing VTO
      const { data, error } = await supabase
        .from('VTO')
        .update({
          coreValues: body.coreValues,
          coreFocus: body.coreFocus,
          tenYearTarget: body.tenYearTarget,
          threeYearPicture: body.threeYearPicture,
          oneYearPlan: body.oneYearPlan,
          quarterlyRocks: body.quarterlyRocks,
          issuesList: body.issuesList,
          annualTarget: body.annualTarget,
          formulaParams: body.formulaParams,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingVto.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new VTO
      const { data, error } = await supabase
        .from('VTO')
        .insert({
          organizationId,
          coreValues: body.coreValues || [],
          coreFocus: body.coreFocus || { purpose: '', niche: '' },
          tenYearTarget: body.tenYearTarget || '',
          threeYearPicture: body.threeYearPicture || { revenue: '', profit: '', measurables: [] },
          oneYearPlan: body.oneYearPlan || { revenue: '', profit: '', goals: [] },
          quarterlyRocks: body.quarterlyRocks || [],
          issuesList: body.issuesList || [],
          annualTarget: body.annualTarget || 1000000,
          formulaParams: body.formulaParams || {
            avgTicket: 3500,
            closeRate: 0.35,
            showRate: 0.70,
            leadToEstimate: 0.85,
          },
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving VTO:', error);
    return NextResponse.json(
      { error: 'Failed to save VTO' },
      { status: 500 }
    );
  }
}

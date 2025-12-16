import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/traction/vto - Get the VTO (Vision/Traction Organizer)
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Get the single VTO record or create default
    const { data: vto, error } = await supabase
      .from('VTO')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      // VTO doesn't exist, create default
      const { data: newVto, error: createError } = await supabase
        .from('VTO')
        .insert({
          coreValues: [],
          coreFocusPurpose: '',
          coreFocusNiche: '',
          tenYearTarget: '',
          threeYearRevenue: 0,
          threeYearProfit: 0,
          threeYearPicture: '',
          oneYearRevenue: 0,
          oneYearProfit: 0,
          oneYearGoals: [],
          targetMarket: '',
          threeUniques: [],
          provenProcess: '',
          guarantee: '',
          longTermIssues: [],
        })
        .select()
        .single();

      if (createError) throw createError;
      return NextResponse.json(newVto);
    }

    if (error) throw error;

    return NextResponse.json(vto);
  } catch (error) {
    console.error('Error fetching VTO:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VTO' },
      { status: 500 }
    );
  }
}

// PATCH /api/traction/vto - Update the VTO
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Get existing VTO or create one
    const { data: existingVto, error: fetchError } = await supabase
      .from('VTO')
      .select('*')
      .limit(1)
      .single();

    let vto;

    if (fetchError && fetchError.code === 'PGRST116') {
      // VTO doesn't exist, create it
      const { data: newVto, error: createError } = await supabase
        .from('VTO')
        .insert({
          coreValues: body.coreValues || [],
          coreFocusPurpose: body.coreFocusPurpose || '',
          coreFocusNiche: body.coreFocusNiche || '',
          tenYearTarget: body.tenYearTarget || '',
          threeYearRevenue: body.threeYearRevenue || 0,
          threeYearProfit: body.threeYearProfit || 0,
          threeYearPicture: body.threeYearPicture || '',
          oneYearRevenue: body.oneYearRevenue || 0,
          oneYearProfit: body.oneYearProfit || 0,
          oneYearGoals: body.oneYearGoals || [],
          targetMarket: body.targetMarket || '',
          threeUniques: body.threeUniques || [],
          provenProcess: body.provenProcess || '',
          guarantee: body.guarantee || '',
          longTermIssues: body.longTermIssues || [],
        })
        .select()
        .single();

      if (createError) throw createError;
      vto = newVto;
    } else if (fetchError) {
      throw fetchError;
    } else {
      // VTO exists, update it
      const updateData: Record<string, unknown> = {};
      if (body.coreValues !== undefined) updateData.coreValues = body.coreValues;
      if (body.coreFocusPurpose !== undefined) updateData.coreFocusPurpose = body.coreFocusPurpose;
      if (body.coreFocusNiche !== undefined) updateData.coreFocusNiche = body.coreFocusNiche;
      if (body.tenYearTarget !== undefined) updateData.tenYearTarget = body.tenYearTarget;
      if (body.threeYearRevenue !== undefined) updateData.threeYearRevenue = body.threeYearRevenue;
      if (body.threeYearProfit !== undefined) updateData.threeYearProfit = body.threeYearProfit;
      if (body.threeYearPicture !== undefined) updateData.threeYearPicture = body.threeYearPicture;
      if (body.oneYearRevenue !== undefined) updateData.oneYearRevenue = body.oneYearRevenue;
      if (body.oneYearProfit !== undefined) updateData.oneYearProfit = body.oneYearProfit;
      if (body.oneYearGoals !== undefined) updateData.oneYearGoals = body.oneYearGoals;
      if (body.targetMarket !== undefined) updateData.targetMarket = body.targetMarket;
      if (body.threeUniques !== undefined) updateData.threeUniques = body.threeUniques;
      if (body.provenProcess !== undefined) updateData.provenProcess = body.provenProcess;
      if (body.guarantee !== undefined) updateData.guarantee = body.guarantee;
      if (body.longTermIssues !== undefined) updateData.longTermIssues = body.longTermIssues;

      const { data: updatedVto, error: updateError } = await supabase
        .from('VTO')
        .update(updateData)
        .eq('id', existingVto.id)
        .select()
        .single();

      if (updateError) throw updateError;
      vto = updatedVto;
    }

    return NextResponse.json(vto);
  } catch (error) {
    console.error('Error updating VTO:', error);
    return NextResponse.json(
      { error: 'Failed to update VTO' },
      { status: 500 }
    );
  }
}

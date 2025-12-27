import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/settings/business - Get business settings
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Get the single business settings record or create default
    let { data: settings, error } = await supabase
      .from('BusinessSettings')
      .select('*')
      .limit(1)
      .single();

    if (error || !settings) {
      // Create default settings
      const { data: newSettings, error: createError } = await supabase
        .from('BusinessSettings')
        .insert({
          subPayoutPct: 60,
          subMaterialsPct: 15,
          subLaborPct: 45,
          minGrossProfitPerJob: 900,
          targetGrossMarginPct: 40,
          defaultDepositPct: 30,
          arTargetDays: 7,
          priceRoundingIncrement: 50,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating business settings:', createError);
        return NextResponse.json(
          { error: 'Failed to create business settings' },
          { status: 500 }
        );
      }

      settings = newSettings;
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching business settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/business - Update business settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerSupabaseClient();

    // Get existing settings
    let { data: settings } = await supabase
      .from('BusinessSettings')
      .select('*')
      .limit(1)
      .single();

    if (!settings) {
      // Create new settings
      const { data: newSettings, error: createError } = await supabase
        .from('BusinessSettings')
        .insert({
          subPayoutPct: body.subPayoutPct ?? 60,
          subMaterialsPct: body.subMaterialsPct ?? 15,
          subLaborPct: body.subLaborPct ?? 45,
          minGrossProfitPerJob: body.minGrossProfitPerJob ?? 900,
          targetGrossMarginPct: body.targetGrossMarginPct ?? 40,
          defaultDepositPct: body.defaultDepositPct ?? 30,
          arTargetDays: body.arTargetDays ?? 7,
          priceRoundingIncrement: body.priceRoundingIncrement ?? 50,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating business settings:', createError);
        return NextResponse.json(
          { error: 'Failed to create business settings' },
          { status: 500 }
        );
      }

      return NextResponse.json(newSettings);
    }

    // Update existing settings
    const updateData: Record<string, unknown> = {};
    if (body.subPayoutPct !== undefined) updateData.subPayoutPct = body.subPayoutPct;
    if (body.subMaterialsPct !== undefined) updateData.subMaterialsPct = body.subMaterialsPct;
    if (body.subLaborPct !== undefined) updateData.subLaborPct = body.subLaborPct;
    if (body.minGrossProfitPerJob !== undefined) updateData.minGrossProfitPerJob = body.minGrossProfitPerJob;
    if (body.targetGrossMarginPct !== undefined) updateData.targetGrossMarginPct = body.targetGrossMarginPct;
    if (body.defaultDepositPct !== undefined) updateData.defaultDepositPct = body.defaultDepositPct;
    if (body.arTargetDays !== undefined) updateData.arTargetDays = body.arTargetDays;
    if (body.priceRoundingIncrement !== undefined) updateData.priceRoundingIncrement = body.priceRoundingIncrement;

    const { data: updatedSettings, error: updateError } = await supabase
      .from('BusinessSettings')
      .update(updateData)
      .eq('id', settings.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating business settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update business settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating business settings:', error);
    return NextResponse.json(
      { error: 'Failed to update business settings' },
      { status: 500 }
    );
  }
}

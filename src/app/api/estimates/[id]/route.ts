import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/estimates/[id] - Get a single estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data: estimate, error } = await supabase
      .from('Estimate')
      .select('*, Lead(*), EstimateLineItem(*), EstimateSignature(*), Job(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Estimate not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error fetching estimate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimate' },
      { status: 500 }
    );
  }
}

// PATCH /api/estimates/[id] - Update an estimate
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // If line items are being updated, recalculate totals
    let calculatedFields: any = {};
    if (body.lineItems) {
      const subtotal = body.lineItems.reduce(
        (sum: number, item: { lineTotal?: number; quantity?: number; unitPrice?: number }) =>
          sum + (item.lineTotal || (item.quantity || 1) * (item.unitPrice || 0)),
        0
      );
      const discountAmount = body.discountAmount ?? 0;
      const totalPrice = subtotal - discountAmount;

      // Get business settings for cost calculations
      const { data: settings } = await supabase
        .from('BusinessSettings')
        .select('*')
        .limit(1)
        .single();

      const subMaterialsPct = settings?.subMaterialsPct || 15;
      const subLaborPct = settings?.subLaborPct || 45;
      const minGrossProfit = settings?.minGrossProfitPerJob || 900;
      const targetGrossMargin = settings?.targetGrossMarginPct || 40;

      const subMaterialsCost = totalPrice * (subMaterialsPct / 100);
      const subLaborCost = totalPrice * (subLaborPct / 100);
      const subTotalCost = subMaterialsCost + subLaborCost;
      const grossProfit = totalPrice - subTotalCost;
      const grossMarginPct = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0;

      calculatedFields = {
        subtotal,
        totalPrice,
        subMaterialsCost,
        subLaborCost,
        subTotalCost,
        grossProfit,
        grossMarginPct,
        meetsMinGp: grossProfit >= minGrossProfit,
        meetsTargetGm: grossMarginPct >= targetGrossMargin,
      };

      // Delete existing line items
      await supabase
        .from('EstimateLineItem')
        .delete()
        .eq('estimateId', id);

      // Create new line items
      const lineItemsData = body.lineItems.map((item: { description: string; location: string; scope?: string; quantity?: number; unitPrice: number; lineTotal?: number }) => ({
        estimateId: id,
        description: item.description,
        location: item.location,
        scope: item.scope,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal || (item.quantity || 1) * item.unitPrice,
      }));

      const { error: lineItemsError } = await supabase
        .from('EstimateLineItem')
        .insert(lineItemsData);

      if (lineItemsError) {
        throw lineItemsError;
      }
    }

    // Build update data
    const updateData: any = { updatedAt: new Date().toISOString() };

    if (body.clientName !== undefined) updateData.clientName = body.clientName;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.estimateDate !== undefined) updateData.estimateDate = new Date(body.estimateDate).toISOString();
    if (body.validUntil !== undefined) updateData.validUntil = new Date(body.validUntil).toISOString();
    if (body.discountAmount !== undefined) updateData.discountAmount = body.discountAmount;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.leadId !== undefined) updateData.leadId = body.leadId;

    // Merge calculated fields
    Object.assign(updateData, calculatedFields);

    const { data: estimate, error: updateError } = await supabase
      .from('Estimate')
      .update(updateData)
      .eq('id', id)
      .select('*, Lead(*), EstimateLineItem(*), EstimateSignature(*)')
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('Error updating estimate:', error);
    return NextResponse.json(
      { error: 'Failed to update estimate' },
      { status: 500 }
    );
  }
}

// DELETE /api/estimates/[id] - Delete an estimate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('Estimate')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting estimate:', error);
    return NextResponse.json(
      { error: 'Failed to delete estimate' },
      { status: 500 }
    );
  }
}

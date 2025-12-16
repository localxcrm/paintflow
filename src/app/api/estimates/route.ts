import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/estimates - Get all estimates with optional filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const leadId = searchParams.get('leadId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('Estimate')
      .select('*, Lead(*), EstimateLineItem(*), EstimateSignature(*)', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (leadId) {
      query = query.eq('leadId', leadId);
    }

    // Search across multiple fields
    if (search) {
      query = query.or(`clientName.ilike.%${search}%,address.ilike.%${search}%,estimateNumber.ilike.%${search}%`);
    }

    // Apply ordering, limit, and offset
    query = query
      .order('estimateDate', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: estimates, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      estimates: estimates || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimates' },
      { status: 500 }
    );
  }
}

// POST /api/estimates - Create a new estimate
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Generate estimate number
    const { data: lastEstimate } = await supabase
      .from('Estimate')
      .select('estimateNumber')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1001;
    if (lastEstimate?.estimateNumber) {
      const match = lastEstimate.estimateNumber.match(/EST-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const estimateNumber = `EST-${nextNumber}`;

    // Calculate totals from line items
    const lineItems = body.lineItems || [];
    const subtotal = lineItems.reduce(
      (sum: number, item: { lineTotal?: number; quantity?: number; unitPrice?: number }) =>
        sum + (item.lineTotal || (item.quantity || 1) * (item.unitPrice || 0)),
      0
    );
    const discountAmount = body.discountAmount || 0;
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

    // Create estimate
    const { data: estimate, error: estimateError } = await supabase
      .from('Estimate')
      .insert({
        estimateNumber,
        clientName: body.clientName,
        address: body.address,
        status: body.status || 'draft',
        estimateDate: body.estimateDate ? new Date(body.estimateDate).toISOString() : new Date().toISOString(),
        validUntil: body.validUntil ? new Date(body.validUntil).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal,
        discountAmount,
        totalPrice,
        subMaterialsCost,
        subLaborCost,
        subTotalCost,
        grossProfit,
        grossMarginPct,
        meetsMinGp: grossProfit >= minGrossProfit,
        meetsTargetGm: grossMarginPct >= targetGrossMargin,
        notes: body.notes,
        leadId: body.leadId,
      })
      .select()
      .single();

    if (estimateError) {
      throw estimateError;
    }

    // Create line items separately
    if (lineItems.length > 0) {
      const lineItemsData = lineItems.map((item: { description: string; location: string; scope?: string; quantity?: number; unitPrice: number; lineTotal?: number }) => ({
        estimateId: estimate.id,
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

    // Fetch the complete estimate with relations
    const { data: completeEstimate, error: fetchError } = await supabase
      .from('Estimate')
      .select('*, Lead(*), EstimateLineItem(*)')
      .eq('id', estimate.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json(completeEstimate, { status: 201 });
  } catch (error) {
    console.error('Error creating estimate:', error);
    return NextResponse.json(
      { error: 'Failed to create estimate' },
      { status: 500 }
    );
  }
}

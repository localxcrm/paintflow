import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/estimates/[id] - Get a single estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        lead: true,
        lineItems: true,
        signature: true,
        job: true,
      },
    });

    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      );
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
    const { id } = await params;
    const body = await request.json();

    // If line items are being updated, recalculate totals
    let calculatedFields = {};
    if (body.lineItems) {
      const subtotal = body.lineItems.reduce(
        (sum: number, item: { lineTotal?: number; quantity?: number; unitPrice?: number }) =>
          sum + (item.lineTotal || (item.quantity || 1) * (item.unitPrice || 0)),
        0
      );
      const discountAmount = body.discountAmount ?? 0;
      const totalPrice = subtotal - discountAmount;

      // Get business settings for cost calculations
      const settings = await prisma.businessSettings.findFirst();
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

      // Delete existing line items and create new ones
      await prisma.estimateLineItem.deleteMany({
        where: { estimateId: id },
      });

      await prisma.estimateLineItem.createMany({
        data: body.lineItems.map((item: { description: string; location: string; scope?: string; quantity?: number; unitPrice: number; lineTotal?: number }) => ({
          estimateId: id,
          description: item.description,
          location: item.location,
          scope: item.scope,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal || (item.quantity || 1) * item.unitPrice,
        })),
      });
    }

    const estimate = await prisma.estimate.update({
      where: { id },
      data: {
        ...(body.clientName !== undefined && { clientName: body.clientName }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.estimateDate !== undefined && { estimateDate: new Date(body.estimateDate) }),
        ...(body.validUntil !== undefined && { validUntil: new Date(body.validUntil) }),
        ...(body.discountAmount !== undefined && { discountAmount: body.discountAmount }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.leadId !== undefined && { leadId: body.leadId }),
        ...calculatedFields,
      },
      include: {
        lead: true,
        lineItems: true,
        signature: true,
      },
    });

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
    const { id } = await params;

    await prisma.estimate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting estimate:', error);
    return NextResponse.json(
      { error: 'Failed to delete estimate' },
      { status: 500 }
    );
  }
}

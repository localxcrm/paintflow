import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/estimates - Get all estimates with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const leadId = searchParams.get('leadId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { estimateNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [estimates, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        include: {
          lead: true,
          lineItems: true,
          signature: true,
        },
        orderBy: { estimateDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.estimate.count({ where }),
    ]);

    return NextResponse.json({
      estimates,
      total,
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
    const body = await request.json();

    // Generate estimate number
    const lastEstimate = await prisma.estimate.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { estimateNumber: true },
    });

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

    const estimate = await prisma.estimate.create({
      data: {
        estimateNumber,
        clientName: body.clientName,
        address: body.address,
        status: body.status || 'draft',
        estimateDate: body.estimateDate ? new Date(body.estimateDate) : new Date(),
        validUntil: body.validUntil ? new Date(body.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
        lineItems: {
          create: lineItems.map((item: { description: string; location: string; scope?: string; quantity?: number; unitPrice: number; lineTotal?: number }) => ({
            description: item.description,
            location: item.location,
            scope: item.scope,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal || (item.quantity || 1) * item.unitPrice,
          })),
        },
      },
      include: {
        lead: true,
        lineItems: true,
      },
    });

    return NextResponse.json(estimate, { status: 201 });
  } catch (error) {
    console.error('Error creating estimate:', error);
    return NextResponse.json(
      { error: 'Failed to create estimate' },
      { status: 500 }
    );
  }
}

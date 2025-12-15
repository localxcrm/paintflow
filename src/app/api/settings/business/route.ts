import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/settings/business - Get business settings
export async function GET() {
  try {
    // Get the single business settings record or create default
    let settings = await prisma.businessSettings.findFirst();

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: {
          subPayoutPct: 60,
          subMaterialsPct: 15,
          subLaborPct: 45,
          minGrossProfitPerJob: 900,
          targetGrossMarginPct: 40,
          defaultDepositPct: 30,
          arTargetDays: 7,
          priceRoundingIncrement: 50,
        },
      });
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

    // Get existing settings or create one
    let settings = await prisma.businessSettings.findFirst();

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: {
          subPayoutPct: body.subPayoutPct ?? 60,
          subMaterialsPct: body.subMaterialsPct ?? 15,
          subLaborPct: body.subLaborPct ?? 45,
          minGrossProfitPerJob: body.minGrossProfitPerJob ?? 900,
          targetGrossMarginPct: body.targetGrossMarginPct ?? 40,
          defaultDepositPct: body.defaultDepositPct ?? 30,
          arTargetDays: body.arTargetDays ?? 7,
          priceRoundingIncrement: body.priceRoundingIncrement ?? 50,
        },
      });
    } else {
      settings = await prisma.businessSettings.update({
        where: { id: settings.id },
        data: {
          ...(body.subPayoutPct !== undefined && { subPayoutPct: body.subPayoutPct }),
          ...(body.subMaterialsPct !== undefined && { subMaterialsPct: body.subMaterialsPct }),
          ...(body.subLaborPct !== undefined && { subLaborPct: body.subLaborPct }),
          ...(body.minGrossProfitPerJob !== undefined && { minGrossProfitPerJob: body.minGrossProfitPerJob }),
          ...(body.targetGrossMarginPct !== undefined && { targetGrossMarginPct: body.targetGrossMarginPct }),
          ...(body.defaultDepositPct !== undefined && { defaultDepositPct: body.defaultDepositPct }),
          ...(body.arTargetDays !== undefined && { arTargetDays: body.arTargetDays }),
          ...(body.priceRoundingIncrement !== undefined && { priceRoundingIncrement: body.priceRoundingIncrement }),
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating business settings:', error);
    return NextResponse.json(
      { error: 'Failed to update business settings' },
      { status: 500 }
    );
  }
}

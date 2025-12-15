import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/vto - Get the VTO (Vision/Traction Organizer)
export async function GET() {
  try {
    // Get the single VTO record or create default
    let vto = await prisma.vTO.findFirst();

    if (!vto) {
      vto = await prisma.vTO.create({
        data: {
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

// PATCH /api/traction/vto - Update the VTO
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Get existing VTO or create one
    let vto = await prisma.vTO.findFirst();

    if (!vto) {
      vto = await prisma.vTO.create({
        data: {
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
        },
      });
    } else {
      vto = await prisma.vTO.update({
        where: { id: vto.id },
        data: {
          ...(body.coreValues !== undefined && { coreValues: body.coreValues }),
          ...(body.coreFocusPurpose !== undefined && { coreFocusPurpose: body.coreFocusPurpose }),
          ...(body.coreFocusNiche !== undefined && { coreFocusNiche: body.coreFocusNiche }),
          ...(body.tenYearTarget !== undefined && { tenYearTarget: body.tenYearTarget }),
          ...(body.threeYearRevenue !== undefined && { threeYearRevenue: body.threeYearRevenue }),
          ...(body.threeYearProfit !== undefined && { threeYearProfit: body.threeYearProfit }),
          ...(body.threeYearPicture !== undefined && { threeYearPicture: body.threeYearPicture }),
          ...(body.oneYearRevenue !== undefined && { oneYearRevenue: body.oneYearRevenue }),
          ...(body.oneYearProfit !== undefined && { oneYearProfit: body.oneYearProfit }),
          ...(body.oneYearGoals !== undefined && { oneYearGoals: body.oneYearGoals }),
          ...(body.targetMarket !== undefined && { targetMarket: body.targetMarket }),
          ...(body.threeUniques !== undefined && { threeUniques: body.threeUniques }),
          ...(body.provenProcess !== undefined && { provenProcess: body.provenProcess }),
          ...(body.guarantee !== undefined && { guarantee: body.guarantee }),
          ...(body.longTermIssues !== undefined && { longTermIssues: body.longTermIssues }),
        },
      });
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

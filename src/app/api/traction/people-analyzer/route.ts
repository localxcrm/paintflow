import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/people-analyzer - Get all people analyzer records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');
    const overallStatus = searchParams.get('overallStatus');

    const where: Record<string, unknown> = {};

    if (personId) {
      where.personId = personId;
    }

    if (overallStatus) {
      where.overallStatus = overallStatus;
    }

    const records = await prisma.peopleAnalyzer.findMany({
      where,
      orderBy: { reviewDate: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching people analyzer records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch people analyzer records' },
      { status: 500 }
    );
  }
}

// POST /api/traction/people-analyzer - Create a new people analyzer record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const record = await prisma.peopleAnalyzer.create({
      data: {
        personName: body.personName,
        personId: body.personId,
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : new Date(),
        coreValueRatings: body.coreValueRatings || {},
        gwcGetsIt: body.gwcGetsIt ?? true,
        gwcWantsIt: body.gwcWantsIt ?? true,
        gwcCapacity: body.gwcCapacity ?? true,
        overallStatus: body.overallStatus || 'right_person_right_seat',
        notes: body.notes,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating people analyzer record:', error);
    return NextResponse.json(
      { error: 'Failed to create people analyzer record' },
      { status: 500 }
    );
  }
}

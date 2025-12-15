import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/seats - Get all seats (accountability chart)
export async function GET() {
  try {
    const seats = await prisma.seat.findMany({
      include: {
        reportsTo: true,
        directReports: true,
      },
      orderBy: { seatName: 'asc' },
    });

    return NextResponse.json(seats);
  } catch (error) {
    console.error('Error fetching seats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seats' },
      { status: 500 }
    );
  }
}

// POST /api/traction/seats - Create a new seat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const seat = await prisma.seat.create({
      data: {
        seatName: body.seatName,
        roleDescription: body.roleDescription,
        responsibilities: body.responsibilities || [],
        personName: body.personName,
        personId: body.personId,
        reportsToId: body.reportsToId,
        gwcGetsIt: body.gwcGetsIt ?? true,
        gwcWantsIt: body.gwcWantsIt ?? true,
        gwcCapacity: body.gwcCapacity ?? true,
        isRightPersonRightSeat: body.isRightPersonRightSeat ?? true,
      },
      include: {
        reportsTo: true,
        directReports: true,
      },
    });

    return NextResponse.json(seat, { status: 201 });
  } catch (error) {
    console.error('Error creating seat:', error);
    return NextResponse.json(
      { error: 'Failed to create seat' },
      { status: 500 }
    );
  }
}

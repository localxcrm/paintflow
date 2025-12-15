import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/rocks - Get all rocks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get('quarter');
    const year = searchParams.get('year');
    const owner = searchParams.get('owner');
    const rockType = searchParams.get('rockType');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (quarter) {
      where.quarter = parseInt(quarter);
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (owner) {
      where.owner = owner;
    }

    if (rockType) {
      where.rockType = rockType;
    }

    if (status) {
      where.status = status;
    }

    const rocks = await prisma.rock.findMany({
      where,
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }, { dueDate: 'asc' }],
    });

    return NextResponse.json(rocks);
  } catch (error) {
    console.error('Error fetching rocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rocks' },
      { status: 500 }
    );
  }
}

// POST /api/traction/rocks - Create a new rock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rock = await prisma.rock.create({
      data: {
        title: body.title,
        description: body.description,
        owner: body.owner,
        rockType: body.rockType || 'individual',
        quarter: body.quarter,
        year: body.year,
        status: body.status || 'on_track',
        dueDate: new Date(body.dueDate),
      },
    });

    return NextResponse.json(rock, { status: 201 });
  } catch (error) {
    console.error('Error creating rock:', error);
    return NextResponse.json(
      { error: 'Failed to create rock' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/subcontractors - Get all subcontractors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (specialty) {
      where.specialty = specialty;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const subcontractors = await prisma.subcontractor.findMany({
      where,
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(subcontractors);
  } catch (error) {
    console.error('Error fetching subcontractors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subcontractors' },
      { status: 500 }
    );
  }
}

// POST /api/subcontractors - Create a new subcontractor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const subcontractor = await prisma.subcontractor.create({
      data: {
        name: body.name,
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        specialty: body.specialty || 'both',
        defaultPayoutPct: body.defaultPayoutPct || 60,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(subcontractor, { status: 201 });
  } catch (error) {
    console.error('Error creating subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to create subcontractor' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/team - Get all team members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const teamMembers = await prisma.teamMember.findMany({
      where,
      include: {
        _count: {
          select: {
            salesJobs: true,
            pmJobs: true,
            assignedLeads: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/team - Create a new team member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const teamMember = await prisma.teamMember.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role || 'both',
        defaultCommissionPct: body.defaultCommissionPct || 5,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(teamMember, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/subcontractors/[id] - Get a single subcontractor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const subcontractor = await prisma.subcontractor.findUnique({
      where: { id },
      include: {
        jobs: {
          take: 10,
          orderBy: { jobDate: 'desc' },
        },
      },
    });

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subcontractor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(subcontractor);
  } catch (error) {
    console.error('Error fetching subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subcontractor' },
      { status: 500 }
    );
  }
}

// PATCH /api/subcontractors/[id] - Update a subcontractor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const subcontractor = await prisma.subcontractor.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.companyName !== undefined && { companyName: body.companyName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.specialty !== undefined && { specialty: body.specialty }),
        ...(body.defaultPayoutPct !== undefined && { defaultPayoutPct: body.defaultPayoutPct }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(subcontractor);
  } catch (error) {
    console.error('Error updating subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to update subcontractor' },
      { status: 500 }
    );
  }
}

// DELETE /api/subcontractors/[id] - Delete a subcontractor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.subcontractor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to delete subcontractor' },
      { status: 500 }
    );
  }
}

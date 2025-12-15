import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/price-book/addons/[id] - Get a single addon
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const addon = await prisma.addon.findUnique({
      where: { id },
    });

    if (!addon) {
      return NextResponse.json(
        { error: 'Addon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(addon);
  } catch (error) {
    console.error('Error fetching addon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addon' },
      { status: 500 }
    );
  }
}

// PATCH /api/price-book/addons/[id] - Update an addon
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const addon = await prisma.addon.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.basePrice !== undefined && { basePrice: body.basePrice }),
      },
    });

    return NextResponse.json(addon);
  } catch (error) {
    console.error('Error updating addon:', error);
    return NextResponse.json(
      { error: 'Failed to update addon' },
      { status: 500 }
    );
  }
}

// DELETE /api/price-book/addons/[id] - Delete an addon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.addon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting addon:', error);
    return NextResponse.json(
      { error: 'Failed to delete addon' },
      { status: 500 }
    );
  }
}

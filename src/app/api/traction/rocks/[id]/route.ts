import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/rocks/[id] - Get a single rock
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rock = await prisma.rock.findUnique({
      where: { id },
    });

    if (!rock) {
      return NextResponse.json(
        { error: 'Rock not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rock);
  } catch (error) {
    console.error('Error fetching rock:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rock' },
      { status: 500 }
    );
  }
}

// PATCH /api/traction/rocks/[id] - Update a rock
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const rock = await prisma.rock.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.owner !== undefined && { owner: body.owner }),
        ...(body.rockType !== undefined && { rockType: body.rockType }),
        ...(body.quarter !== undefined && { quarter: body.quarter }),
        ...(body.year !== undefined && { year: body.year }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.dueDate !== undefined && { dueDate: new Date(body.dueDate) }),
      },
    });

    return NextResponse.json(rock);
  } catch (error) {
    console.error('Error updating rock:', error);
    return NextResponse.json(
      { error: 'Failed to update rock' },
      { status: 500 }
    );
  }
}

// DELETE /api/traction/rocks/[id] - Delete a rock
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.rock.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rock:', error);
    return NextResponse.json(
      { error: 'Failed to delete rock' },
      { status: 500 }
    );
  }
}

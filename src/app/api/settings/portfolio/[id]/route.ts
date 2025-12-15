import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/settings/portfolio/[id] - Get a single portfolio image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const portfolioImage = await prisma.portfolioImage.findUnique({
      where: { id },
    });

    if (!portfolioImage) {
      return NextResponse.json(
        { error: 'Portfolio image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(portfolioImage);
  } catch (error) {
    console.error('Error fetching portfolio image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio image' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/portfolio/[id] - Delete a portfolio image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.portfolioImage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting portfolio image:', error);
    return NextResponse.json(
      { error: 'Failed to delete portfolio image' },
      { status: 500 }
    );
  }
}

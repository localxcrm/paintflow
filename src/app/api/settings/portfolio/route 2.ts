import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/settings/portfolio - Get all portfolio images
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectType = searchParams.get('projectType');

    const where: Record<string, unknown> = {};

    if (projectType) {
      where.projectType = projectType;
    }

    const portfolioImages = await prisma.portfolioImage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(portfolioImages);
  } catch (error) {
    console.error('Error fetching portfolio images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio images' },
      { status: 500 }
    );
  }
}

// POST /api/settings/portfolio - Add a new portfolio image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const portfolioImage = await prisma.portfolioImage.create({
      data: {
        beforeUrl: body.beforeUrl,
        afterUrl: body.afterUrl,
        projectType: body.projectType || 'interior',
        description: body.description,
      },
    });

    return NextResponse.json(portfolioImage, { status: 201 });
  } catch (error) {
    console.error('Error creating portfolio image:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio image' },
      { status: 500 }
    );
  }
}

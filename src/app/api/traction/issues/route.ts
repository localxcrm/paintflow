import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/issues - Get all issues
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueType = searchParams.get('issueType');
    const status = searchParams.get('status');
    const createdBy = searchParams.get('createdBy');

    const where: Record<string, unknown> = {};

    if (issueType) {
      where.issueType = issueType;
    }

    if (status) {
      where.status = status;
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    const issues = await prisma.issue.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

// POST /api/traction/issues - Create a new issue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const issue = await prisma.issue.create({
      data: {
        title: body.title,
        description: body.description,
        issueType: body.issueType || 'short_term',
        priority: body.priority || 2,
        status: body.status || 'open',
        createdBy: body.createdBy,
        resolution: body.resolution,
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}

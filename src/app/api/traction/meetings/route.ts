import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/meetings - Get all meetings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingType = searchParams.get('meetingType');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};

    if (meetingType) {
      where.meetingType = meetingType;
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        orderBy: { meetingDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.meeting.count({ where }),
    ]);

    return NextResponse.json({
      meetings,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

// POST /api/traction/meetings - Create a new meeting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const meeting = await prisma.meeting.create({
      data: {
        meetingDate: new Date(body.meetingDate),
        meetingType: body.meetingType || 'l10',
        attendees: body.attendees || [],
        ratingAvg: body.ratingAvg || 0,
        segueNotes: body.segueNotes,
        headlines: body.headlines,
        notes: body.notes,
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}

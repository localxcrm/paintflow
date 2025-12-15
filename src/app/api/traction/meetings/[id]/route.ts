import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/traction/meetings/[id] - Get a single meeting
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    );
  }
}

// PATCH /api/traction/meetings/[id] - Update a meeting
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...(body.meetingDate !== undefined && { meetingDate: new Date(body.meetingDate) }),
        ...(body.meetingType !== undefined && { meetingType: body.meetingType }),
        ...(body.attendees !== undefined && { attendees: body.attendees }),
        ...(body.ratingAvg !== undefined && { ratingAvg: body.ratingAvg }),
        ...(body.segueNotes !== undefined && { segueNotes: body.segueNotes }),
        ...(body.headlines !== undefined && { headlines: body.headlines }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    );
  }
}

// DELETE /api/traction/meetings/[id] - Delete a meeting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.meeting.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}

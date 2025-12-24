import { NextRequest, NextResponse } from 'next/server';
import { sendPushToUser } from '@/lib/push-service';

// POST /api/push/send - Send push notification
// This endpoint can still be used for external calls if needed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      workOrderToken,
      targetUserType,
      title,
      message,
      url,
      workOrderId,
    } = body;

    if (!targetUserType || !['admin', 'subcontractor'].includes(targetUserType)) {
      return NextResponse.json(
        { error: 'Invalid targetUserType' },
        { status: 400 }
      );
    }

    if (!organizationId && !workOrderToken) {
      return NextResponse.json(
        { error: 'Missing organizationId or workOrderToken' },
        { status: 400 }
      );
    }

    const result = await sendPushToUser({
      organizationId,
      workOrderToken,
      targetUserType,
      title,
      message,
      url,
      workOrderId,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

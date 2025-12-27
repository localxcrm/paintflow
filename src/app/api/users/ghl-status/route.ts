import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/users/ghl-status
 *
 * Returns the GHL link status for the current user.
 *
 * Response:
 * - isLinked: boolean - whether user is linked to GHL
 * - ghlUserId: string | null - GHL user ID if linked
 * - ghlLocationId: string | null - GHL location ID if linked
 * - ghlLinkedAt: string | null - when the link was created
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const isLinked = !!user.ghlUserId;

    return NextResponse.json({
      isLinked,
      ghlUserId: user.ghlUserId || null,
      ghlLocationId: user.ghlLocationId || null,
      ghlLinkedAt: user.ghlLinkedAt || null,
    });
  } catch (error) {
    console.error('Error fetching GHL status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GHL status' },
      { status: 500 }
    );
  }
}

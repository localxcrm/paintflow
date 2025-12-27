import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, verifyPassword } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/users/ghl-unlink
 *
 * Unlinks the current user from GoHighLevel.
 * If user has a password (traditional account), requires password confirmation.
 * If user has no password (GHL-only account), cannot unlink.
 *
 * Request Body:
 * - password: string (required if user has a password)
 *
 * Response:
 * - success: boolean
 * - message: string
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is linked to GHL
    if (!user.ghlUserId) {
      return NextResponse.json(
        { error: 'User is not linked to GoHighLevel' },
        { status: 400 }
      );
    }

    // Check if user has a password (traditional account)
    const hasPassword = user.passwordHash && user.passwordHash.length > 0;

    if (!hasPassword) {
      return NextResponse.json(
        {
          error: 'Cannot unlink GHL-only account. Please set a password first.',
          code: 'NO_PASSWORD',
        },
        { status: 400 }
      );
    }

    // Require password confirmation for traditional accounts
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password confirmation required' },
        { status: 400 }
      );
    }

    // Verify password
    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Unlink GHL
    const supabase = createServerSupabaseClient();

    const { error: updateError } = await supabase
      .from('User')
      .update({
        ghlUserId: null,
        ghlLocationId: null,
        ghlLinkedAt: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to unlink GHL:', updateError);
      return NextResponse.json(
        { error: 'Failed to unlink GoHighLevel account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'GoHighLevel account successfully unlinked',
    });
  } catch (error) {
    console.error('Error unlinking GHL:', error);
    return NextResponse.json(
      { error: 'Failed to unlink GoHighLevel account' },
      { status: 500 }
    );
  }
}

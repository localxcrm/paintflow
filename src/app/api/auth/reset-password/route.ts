import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { hashPassword } from '@/lib/auth';

/**
 * POST /api/auth/reset-password
 *
 * Validates the reset token and updates the user's password.
 *
 * Request Body:
 * - token: string - The reset token from the email
 * - password: string - The new password
 *
 * Response:
 * - message: string on success
 * - error: string on failure
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Find valid reset token
    const { data: resetRecord, error: findError } = await supabase
      .from('PasswordReset')
      .select('id, userId, expiresAt, usedAt')
      .eq('token', token)
      .single();

    if (findError || !resetRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    // Check if token was already used
    if (resetRecord.usedAt) {
      return NextResponse.json(
        { error: 'This reset link has already been used' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(resetRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This reset link has expired' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = hashPassword(password);

    // Update user's password
    const { error: updateError } = await supabase
      .from('User')
      .update({
        passwordHash,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', resetRecord.userId);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Mark token as used
    await supabase
      .from('PasswordReset')
      .update({ usedAt: new Date().toISOString() })
      .eq('id', resetRecord.id);

    // Delete all sessions for this user (force re-login)
    await supabase
      .from('Session')
      .delete()
      .eq('userId', resetRecord.userId);

    return NextResponse.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

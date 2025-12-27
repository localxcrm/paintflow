import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';

/**
 * POST /api/auth/forgot-password
 *
 * Generates a password reset token and stores it in the database.
 * In production, this should send an email with the reset link.
 *
 * Request Body:
 * - email: string
 *
 * Response:
 * - message: string (always success to prevent email enumeration)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Find user by email
    const { data: user } = await supabase
      .from('User')
      .select('id, email, name')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration attacks
    // But only create token if user exists
    if (user) {
      // Generate secure reset token
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

      // Store reset token in database
      // First, delete any existing tokens for this user
      await supabase
        .from('PasswordReset')
        .delete()
        .eq('userId', user.id);

      // Create new token
      await supabase
        .from('PasswordReset')
        .insert({
          userId: user.id,
          token: resetToken,
          expiresAt: expiresAt.toISOString(),
        });

      // Build reset URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      // TODO: Send email with resetUrl
      // For now, log it (remove in production!)
      console.log('Password reset requested for:', email);
      console.log('Reset URL:', resetUrl);

      // In production, integrate with email service like:
      // - Resend
      // - SendGrid
      // - AWS SES
      // - Nodemailer
    }

    // Always return success (security best practice)
    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

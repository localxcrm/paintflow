import { NextRequest, NextResponse } from 'next/server';
import { buildGhlSsoUrl } from '@/lib/ghl';

/**
 * GET /api/ghl/generate-sso-url
 *
 * Proxy endpoint that receives GHL parameters and generates a signed SSO URL.
 * This endpoint is called by GoHighLevel when user clicks the menu item.
 *
 * Query Parameters:
 * - location_id: GHL location ID
 * - user_id: GHL user ID
 * - user_email: User's email
 * - user_name: User's display name
 *
 * Response: Redirect to /api/auth/ghl with signed parameters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const location_id = searchParams.get('location_id');
    const user_id = searchParams.get('user_id');
    const user_email = searchParams.get('user_email');
    const user_name = searchParams.get('user_name');

    // Validate required parameters
    if (!location_id) {
      return NextResponse.json(
        { error: 'Missing location_id parameter' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id parameter' },
        { status: 400 }
      );
    }

    if (!user_email) {
      return NextResponse.json(
        { error: 'Missing user_email parameter' },
        { status: 400 }
      );
    }

    if (!user_name) {
      return NextResponse.json(
        { error: 'Missing user_name parameter' },
        { status: 400 }
      );
    }

    // Check if GHL_SSO_SECRET is configured
    if (!process.env.GHL_SSO_SECRET) {
      console.error('GHL_SSO_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'SSO not configured' },
        { status: 500 }
      );
    }

    // Get base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Build signed SSO URL
    const ssoUrl = buildGhlSsoUrl(baseUrl, {
      location_id,
      user_id,
      user_email,
      user_name,
    });

    // Redirect to SSO handler
    return NextResponse.redirect(ssoUrl);
  } catch (error) {
    console.error('Error generating SSO URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate SSO URL' },
      { status: 500 }
    );
  }
}

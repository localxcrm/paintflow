import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { validateGhlSsoParams } from '@/lib/ghl';
import { generateSessionToken, getSessionExpiry } from '@/lib/auth';
import type { User, GhlLocation } from '@/types/database';

/**
 * GET /api/auth/ghl
 *
 * SSO handler that validates GHL signature and creates/logs in user.
 *
 * Query Parameters:
 * - location_id: GHL location ID
 * - user_id: GHL user ID
 * - user_email: User's email
 * - user_name: User's display name
 * - timestamp: Unix timestamp when signature was generated
 * - signature: HMAC SHA256 signature
 *
 * Flow:
 * 1. Validate signature and timestamp
 * 2. Find or create user
 * 3. Find or create GhlLocation -> Organization mapping
 * 4. Link user to organization
 * 5. Create session with iframe-compatible cookies
 * 6. Redirect to dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract parameters
    const params = {
      location_id: searchParams.get('location_id') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      user_email: searchParams.get('user_email') || undefined,
      user_name: searchParams.get('user_name') || undefined,
      timestamp: searchParams.get('timestamp') || undefined,
      signature: searchParams.get('signature') || undefined,
    };

    // Log incoming parameters for debugging
    console.log('GHL SSO Request:', {
      location_id: params.location_id,
      user_id: params.user_id,
      user_email: params.user_email,
      user_name: params.user_name,
      timestamp: params.timestamp,
      hasSignature: !!params.signature,
    });

    // Validate parameters and signature
    const validation = validateGhlSsoParams(params);

    if (!validation.valid || !validation.parsed) {
      console.error('GHL SSO validation failed:', validation.error);
      return createErrorRedirect(request, validation.error || 'Invalid SSO parameters');
    }

    console.log('GHL SSO validation passed');

    const { location_id, user_id, user_email, user_name } = validation.parsed;

    const supabase = createServerSupabaseClient();

    // Step 1: Find or create user
    let user = await findOrCreateUser(supabase, {
      ghlUserId: user_id,
      email: user_email.toLowerCase(),
      name: user_name,
      ghlLocationId: location_id,
    });

    if (!user) {
      return createErrorRedirect(request, 'Failed to create user account');
    }

    // Step 2: Find or create GhlLocation -> Organization mapping
    const organization = await findOrCreateOrganization(supabase, {
      ghlLocationId: location_id,
      locationName: `GHL Location ${location_id.substring(0, 8)}`,
      userEmail: user_email,
    });

    if (!organization) {
      return createErrorRedirect(request, 'Failed to create organization');
    }

    // Step 3: Ensure user is linked to organization
    await ensureUserOrganizationLink(supabase, user.id, organization.id);

    // Step 4: Create session
    const token = generateSessionToken();
    const expiresAt = getSessionExpiry();

    const { error: sessionError } = await supabase
      .from('Session')
      .insert({
        token,
        userId: user.id,
        organizationId: organization.id,
        expiresAt: expiresAt.toISOString(),
      });

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
      return createErrorRedirect(request, 'Failed to create session');
    }

    // Step 5: Set cookies for iframe compatibility
    const cookieStore = await cookies();

    // Session cookie - must be SameSite=None for iframe
    cookieStore.set('paintpro_session', token, {
      httpOnly: true,
      secure: true, // Required for SameSite=None
      sameSite: 'none', // Required for cross-site iframe
      expires: expiresAt,
      path: '/',
    });

    // Organization cookie
    cookieStore.set('paintpro_org_id', organization.id, {
      httpOnly: false, // Allow client-side access
      secure: true,
      sameSite: 'none',
      expires: expiresAt,
      path: '/',
    });

    console.log('GHL SSO success - redirecting to dashboard');

    // Step 6: Redirect to a page that will store the token in localStorage
    // This is needed because third-party cookies are blocked in iframes
    const callbackUrl = new URL('/auth/callback', request.nextUrl.origin);
    callbackUrl.searchParams.set('token', token);
    callbackUrl.searchParams.set('org', organization.id);
    callbackUrl.searchParams.set('redirect', '/painel');
    return NextResponse.redirect(callbackUrl);
  } catch (error) {
    console.error('GHL SSO error:', error);
    return createErrorRedirect(request, 'SSO authentication failed');
  }
}

/**
 * Find user by GHL user ID or email, create if not exists
 */
async function findOrCreateUser(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  params: {
    ghlUserId: string;
    email: string;
    name: string;
    ghlLocationId: string;
  }
): Promise<User | null> {
  const { ghlUserId, email, name, ghlLocationId } = params;

  // First, try to find by GHL user ID
  const { data: existingByGhl } = await supabase
    .from('User')
    .select('*')
    .eq('ghlUserId', ghlUserId)
    .single<User>();

  if (existingByGhl) {
    // Update last login
    await supabase
      .from('User')
      .update({ lastLoginAt: new Date().toISOString() })
      .eq('id', existingByGhl.id);

    return existingByGhl;
  }

  // Second, try to find by email
  const { data: existingByEmail } = await supabase
    .from('User')
    .select('*')
    .eq('email', email)
    .single<User>();

  if (existingByEmail) {
    // Link GHL IDs to existing user (auto-link by email)
    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({
        ghlUserId: ghlUserId,
        ghlLocationId: ghlLocationId,
        ghlLinkedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      })
      .eq('id', existingByEmail.id)
      .select()
      .single<User>();

    if (updateError) {
      console.error('Failed to link GHL to existing user:', updateError);
      return existingByEmail; // Return existing user even if update failed
    }

    return updatedUser;
  }

  // Create new user (no password - SSO only)
  const { data: newUser, error: createError } = await supabase
    .from('User')
    .insert({
      email,
      name,
      passwordHash: '', // Empty - user can only login via GHL SSO
      role: 'user',
      isActive: true,
      ghlUserId: ghlUserId,
      ghlLocationId: ghlLocationId,
      ghlLinkedAt: new Date().toISOString(),
    })
    .select()
    .single<User>();

  if (createError) {
    console.error('Failed to create GHL user:', createError);
    return null;
  }

  return newUser;
}

/**
 * Find GhlLocation or create with new Organization
 */
async function findOrCreateOrganization(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  params: {
    ghlLocationId: string;
    locationName: string;
    userEmail: string;
  }
): Promise<{ id: string; name: string } | null> {
  const { ghlLocationId, locationName, userEmail } = params;

  // Try to find existing GhlLocation mapping
  const { data: existingLocation } = await supabase
    .from('GhlLocation')
    .select('organizationId, Organization:organizationId(id, name)')
    .eq('ghlLocationId', ghlLocationId)
    .single<GhlLocation & { Organization: { id: string; name: string } }>();

  if (existingLocation?.Organization) {
    return {
      id: existingLocation.Organization.id,
      name: existingLocation.Organization.name,
    };
  }

  // Create new Organization
  const slug = `ghl-${ghlLocationId.substring(0, 12).toLowerCase()}`;

  const { data: newOrg, error: orgError } = await supabase
    .from('Organization')
    .insert({
      name: locationName,
      slug,
      email: userEmail,
      plan: 'free',
      isActive: true,
    })
    .select('id, name')
    .single();

  if (orgError || !newOrg) {
    console.error('Failed to create organization:', orgError);
    return null;
  }

  // Create GhlLocation mapping
  const { error: locationError } = await supabase
    .from('GhlLocation')
    .insert({
      ghlLocationId,
      organizationId: newOrg.id,
      locationName,
    });

  if (locationError) {
    console.error('Failed to create GhlLocation:', locationError);
    // Organization was created, so continue
  }

  // Create default VTO
  await supabase.from('VTO').insert({
    organizationId: newOrg.id,
    annualTarget: 1000000,
    formulaParams: {
      avgTicket: 3500,
      closeRate: 0.35,
      showRate: 0.70,
      leadToEstimate: 0.85,
    },
  });

  // Create default business settings
  await supabase.from('BusinessSettings').insert({
    organizationId: newOrg.id,
    companyName: locationName,
    email: userEmail,
    marketingChannels: [
      { id: 'meta', label: 'Meta Ads', color: '#1877F2' },
      { id: 'google', label: 'Google Ads', color: '#EA4335' },
      { id: 'indicacao', label: 'Indicacao', color: '#10B981' },
      { id: 'organico', label: 'Organico', color: '#8B5CF6' },
    ],
  });

  return newOrg;
}

/**
 * Ensure user is linked to organization
 */
async function ensureUserOrganizationLink(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  userId: string,
  organizationId: string
): Promise<void> {
  // Check if link already exists
  const { data: existingLink } = await supabase
    .from('UserOrganization')
    .select('id')
    .eq('userId', userId)
    .eq('organizationId', organizationId)
    .single();

  if (existingLink) {
    return; // Already linked
  }

  // Check if user has any other organization links
  const { data: otherLinks } = await supabase
    .from('UserOrganization')
    .select('id')
    .eq('userId', userId);

  const isDefault = !otherLinks || otherLinks.length === 0;

  // Create link
  await supabase.from('UserOrganization').insert({
    userId,
    organizationId,
    role: 'member',
    isDefault,
  });
}

/**
 * Create error redirect response
 */
function createErrorRedirect(request: NextRequest, error: string): NextResponse {
  const errorUrl = new URL('/login', request.nextUrl.origin);
  errorUrl.searchParams.set('error', 'sso_failed');
  errorUrl.searchParams.set('message', error);
  return NextResponse.redirect(errorUrl);
}

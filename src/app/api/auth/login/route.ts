import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { verifyPassword, createSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import type { User } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Find user
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email.toLowerCase())
      .single<User>();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await supabase
      .from('User')
      .update({ lastLoginAt: new Date().toISOString() })
      .eq('id', user.id);

    // Get user's organizations
    const { data: userOrgs } = await supabase
      .from('UserOrganization')
      .select(`
        role,
        isDefault,
        Organization:organizationId (
          id,
          name,
          slug,
          plan,
          isActive
        )
      `)
      .eq('userId', user.id);

    // Map organizations
    const organizations = (userOrgs || [])
      .filter((uo: Record<string, unknown>) => {
        const org = uo.Organization as { isActive: boolean } | null;
        return org && org.isActive;
      })
      .map((uo: Record<string, unknown>) => {
        const org = uo.Organization as { id: string; name: string; slug: string; plan: string };
        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
          role: uo.role as string,
          isDefault: uo.isDefault as boolean,
        };
      });

    // Find default organization
    const defaultOrg = organizations.find(o => o.isDefault) || organizations[0];

    // Create session with organization if available
    const session = await createSession(user.id, defaultOrg?.id);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('paintpro_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(session.expiresAt),
      path: '/',
    });

    // Set organization cookie if available
    if (defaultOrg) {
      cookieStore.set('paintpro_org_id', defaultOrg.id, {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(session.expiresAt),
        path: '/',
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      // Include session token for localStorage (iframe compatibility)
      sessionToken: session.token,
      organizations,
      currentOrganization: defaultOrg || null,
      needsOrgSelection: organizations.length > 1 || organizations.length === 0,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}

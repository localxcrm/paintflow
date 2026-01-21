import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSessionTokenFromRequest, query } from '@/lib/supabase-server';
import { createOrganization, updateSessionOrganization } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/organizations - Get user's organizations
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get session token from cookies
    const sessionToken = getSessionTokenFromRequest(request);
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user from session
    const { data: session } = await supabase
      .from('Session')
      .select('userId')
      .eq('token', sessionToken)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user's organizations with proper JOIN (QueryBuilder doesn't support nested select)
    const organizations = await query<{
      id: string;
      name: string;
      slug: string;
      email: string | null;
      phone: string | null;
      plan: string;
      logo: string | null;
      isActive: boolean;
      createdAt: string;
      role: string;
      isDefault: boolean;
    }>(
      `SELECT
        o.id, o.name, o.slug, o.email, o.phone, o.plan, o.logo, o."isActive", o."createdAt",
        uo.role, uo."isDefault"
      FROM "UserOrganization" uo
      JOIN "Organization" o ON uo."organizationId" = o.id
      WHERE uo."userId" = $1 AND o."isActive" = true
      ORDER BY uo."isDefault" DESC, o."createdAt" DESC`,
      [session.userId]
    );

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get session token from cookies
    const sessionToken = getSessionTokenFromRequest(request);
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user from session
    const { data: session } = await supabase
      .from('Session')
      .select('userId')
      .eq('token', sessionToken)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Create organization
    const org = await createOrganization(name, session.userId, email);

    return NextResponse.json({
      organization: {
        id: org.id,
        name,
        slug: org.slug,
        plan: 'free',
        role: 'owner',
      },
      message: 'Organization created successfully',
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

// PUT /api/organizations - Switch to a different organization
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get session token from cookies
    const sessionToken = getSessionTokenFromRequest(request);
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user from session
    const { data: session } = await supabase
      .from('Session')
      .select('userId')
      .eq('token', sessionToken)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const { data: userOrg } = await supabase
      .from('UserOrganization')
      .select('role')
      .eq('userId', session.userId)
      .eq('organizationId', organizationId)
      .single();

    if (!userOrg) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }

    // Get organization details
    const { data: org } = await supabase
      .from('Organization')
      .select('id, name, slug, plan, isActive')
      .eq('id', organizationId)
      .single();

    if (!org || !org.isActive) {
      return NextResponse.json(
        { error: 'Organization not found or inactive' },
        { status: 404 }
      );
    }

    // Update session with new organization
    await updateSessionOrganization(sessionToken, organizationId);

    // Set organization cookie
    const cookieStore = await cookies();
    cookieStore.set('paintpro_org_id', organizationId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      organization: {
        ...org,
        role: userOrg.role,
      },
      message: 'Organization switched successfully',
    });
  } catch (error) {
    console.error('Error switching organization:', error);
    return NextResponse.json(
      { error: 'Failed to switch organization' },
      { status: 500 }
    );
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// ============================================
// PLAN LIMITS FOR SAAS
// ============================================
export const PLAN_LIMITS = {
  free: {
    users: 1,
    jobsPerMonth: 10,
    storage: '100MB',
    features: ['jobs', 'estimates', 'leads'],
  },
  starter: {
    users: 3,
    jobsPerMonth: 50,
    storage: '1GB',
    features: ['jobs', 'estimates', 'leads', 'calendar', 'map', 'reports'],
  },
  pro: {
    users: 10,
    jobsPerMonth: -1, // unlimited
    storage: '10GB',
    features: ['all'],
  },
  enterprise: {
    users: -1, // unlimited
    jobsPerMonth: -1,
    storage: 'unlimited',
    features: ['all', 'api', 'whitelabel', 'dedicated-support'],
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

// ============================================
// CLIENT-SIDE SUPABASE
// ============================================

// Get client-side Supabase client (lazy initialization)
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Export a default instance for convenience (client-side only)
export const supabase: SupabaseClient | null = typeof window !== 'undefined' ? getSupabaseClient() : null;

// ============================================
// SERVER-SIDE SUPABASE
// ============================================

// Server-side client with service role key (for API routes)
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================
// MULTI-TENANCY HELPERS
// ============================================

// Cookie name for organization ID
export const ORG_COOKIE_NAME = 'paintpro_org_id';

// Get organization ID from cookies (server-side)
export async function getOrganizationId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(ORG_COOKIE_NAME)?.value || null;
  } catch {
    return null;
  }
}

// Get organization ID from request headers (for API routes)
export function getOrganizationIdFromRequest(request: Request): string | null {
  // Try from cookie header
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`${ORG_COOKIE_NAME}=([^;]+)`));
    if (match) {
      return match[1];
    }
  }

  // Try from custom header (for API clients)
  const orgHeader = request.headers.get('x-organization-id');
  if (orgHeader) {
    return orgHeader;
  }

  return null;
}

// Create Supabase client with organization context for RLS
export async function createOrgSupabaseClient(organizationId?: string): Promise<SupabaseClient> {
  const supabase = createServerSupabaseClient();

  // Get org ID from parameter or cookies
  const orgId = organizationId || await getOrganizationId();

  if (orgId) {
    // Set RLS context using PostgreSQL session variable
    try {
      await supabase.rpc('set_config', {
        setting: 'app.current_organization_id',
        value: orgId,
      });
    } catch {
      // Ignore error if function doesn't exist yet
    }
  }

  return supabase;
}

// ============================================
// SESSION HELPERS
// ============================================

export const SESSION_COOKIE_NAME = 'paintpro_session';

// Get session token from cookies
export async function getSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
  } catch {
    return null;
  }
}

// Get session token from request
export function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Validate session and get user/org info
export async function validateSession(token: string): Promise<{
  userId: string;
  organizationId: string | null;
  user: { id: string; email: string; name: string };
  organization: { id: string; name: string; slug: string; plan: string } | null;
} | null> {
  const supabase = createServerSupabaseClient();

  const { data: session, error } = await supabase
    .from('Session')
    .select(`
      id,
      userId,
      organizationId,
      expiresAt
    `)
    .eq('token', token)
    .single();

  if (error || !session) {
    return null;
  }

  // Check if session expired
  if (new Date(session.expiresAt) < new Date()) {
    // Delete expired session
    await supabase.from('Session').delete().eq('id', session.id);
    return null;
  }

  // Get user info
  const { data: user } = await supabase
    .from('User')
    .select('id, email, name')
    .eq('id', session.userId)
    .single();

  if (!user) {
    return null;
  }

  // Get organization info if set
  let organization = null;
  if (session.organizationId) {
    const { data: org } = await supabase
      .from('Organization')
      .select('id, name, slug, plan')
      .eq('id', session.organizationId)
      .single();
    organization = org;
  }

  return {
    userId: session.userId,
    organizationId: session.organizationId,
    user,
    organization,
  };
}

// ============================================
// ORGANIZATION HELPERS
// ============================================

// Get all organizations for a user
export async function getUserOrganizations(userId: string): Promise<Array<{
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
  isDefault: boolean;
}>> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('UserOrganization')
    .select(`
      role,
      isDefault,
      Organization:organizationId (
        id,
        name,
        slug,
        plan
      )
    `)
    .eq('userId', userId);

  if (error || !data) {
    return [];
  }

  return data.map((item: Record<string, unknown>) => {
    const org = item.Organization as { id: string; name: string; slug: string; plan: string };
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      role: item.role as string,
      isDefault: item.isDefault as boolean,
    };
  });
}

// Get default organization for a user
export async function getDefaultOrganization(userId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient();

  const { data } = await supabase
    .from('UserOrganization')
    .select('organizationId')
    .eq('userId', userId)
    .eq('isDefault', true)
    .single();

  if (data) {
    return data.organizationId;
  }

  // Fallback to first organization
  const { data: first } = await supabase
    .from('UserOrganization')
    .select('organizationId')
    .eq('userId', userId)
    .limit(1)
    .single();

  return first?.organizationId || null;
}

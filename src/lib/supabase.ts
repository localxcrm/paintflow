import { createClient, SupabaseClient } from '@supabase/supabase-js';


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
// CONSTANTS
// ============================================

export const ORG_COOKIE_NAME = 'paintpro_org_id';
export const SESSION_COOKIE_NAME = 'paintpro_session';

// ============================================
// SERVER-SIDE SUPABASE MOVED TO @/lib/supabase-server.ts
// ============================================


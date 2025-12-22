import { createClient } from '@supabase/supabase-js';

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
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null as any;

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

// Admin client for server-side operations (singleton pattern)
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      throw new Error('Supabase environment variables are not configured');
    }

    _supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

// Export supabaseAdmin as the client directly
// Using 'any' to bypass strict typing until database types are generated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseAdmin: any = {
  from: (table: string) => getSupabaseAdmin().from(table),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: (fn: string, params?: any) => getSupabaseAdmin().rpc(fn as any, params),
};

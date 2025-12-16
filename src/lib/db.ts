// Database helper for Supabase
// This file provides a simple wrapper similar to Prisma's API

import { createServerSupabaseClient } from './supabase';

// Export the Supabase client creator for direct use
export function getSupabaseClient() {
  return createServerSupabaseClient();
}

// Convenience export for common pattern
export const db = {
  get client() {
    return createServerSupabaseClient();
  }
};

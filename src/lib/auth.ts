import { createServerSupabaseClient } from './supabase';
import { cookies } from 'next/headers';
import type { User, Session, SessionWithUser } from '@/types/database';

// Simple hash function for demo purposes
// In production, use bcrypt or argon2
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Add a salt-like prefix and convert to hex
  return 'pp_' + Math.abs(hash).toString(16).padStart(8, '0');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Generate a secure session token
export function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Session expiry time (7 days)
export const SESSION_EXPIRY_DAYS = 7;

export function getSessionExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + SESSION_EXPIRY_DAYS);
  return expiry;
}

// Get current user from session
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createServerSupabaseClient();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('paintpro_session')?.value;

    if (!sessionToken) {
      return null;
    }

    const { data: session, error } = await supabase
      .from('Session')
      .select('*, User(*)')
      .eq('token', sessionToken)
      .single<SessionWithUser>();

    if (error || !session) {
      return null;
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      return null;
    }

    return session.User;
  } catch {
    return null;
  }
}

// Create session for user
export async function createSession(userId: string): Promise<Session> {
  const supabase = createServerSupabaseClient();
  const token = generateSessionToken();
  const expiresAt = getSessionExpiry();

  const { data: session, error } = await supabase
    .from('Session')
    .insert({
      token,
      userId,
      expiresAt: expiresAt.toISOString(),
    })
    .select()
    .single<Session>();

  if (error || !session) {
    throw new Error('Failed to create session');
  }

  return session;
}

// Delete session
export async function deleteSession(token: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('Session')
      .delete()
      .eq('token', token);

    return !error;
  } catch {
    return false;
  }
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  const supabase = createServerSupabaseClient();

  await supabase
    .from('Session')
    .delete()
    .lt('expiresAt', new Date().toISOString());
}

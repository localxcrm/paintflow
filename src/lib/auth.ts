import { createServerSupabaseClient } from './supabase-server';
import { ORG_COOKIE_NAME, SESSION_COOKIE_NAME } from './supabase';
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
export async function createSession(userId: string, organizationId?: string): Promise<Session> {
  const supabase = createServerSupabaseClient();
  const token = generateSessionToken();
  const expiresAt = getSessionExpiry();

  const { data: session, error } = await supabase
    .from('Session')
    .insert({
      token,
      userId,
      organizationId: organizationId || null,
      expiresAt: expiresAt.toISOString(),
    })
    .select()
    .single<Session>();

  if (error || !session) {
    throw new Error('Failed to create session');
  }

  return session;
}

// Update session with organization
export async function updateSessionOrganization(token: string, organizationId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('Session')
      .update({ organizationId })
      .eq('token', token);

    return !error;
  } catch {
    return false;
  }
}

// Generate URL-safe slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '')         // Trim dashes from ends
    .substring(0, 50);               // Limit length
}

// Create organization for new user
export async function createOrganization(
  name: string,
  userId: string,
  email?: string
): Promise<{ id: string; slug: string }> {
  const supabase = createServerSupabaseClient();

  // Generate unique slug
  let slug = generateSlug(name);
  let slugSuffix = 0;

  // Check if slug exists and add suffix if needed
  while (true) {
    const checkSlug = slugSuffix > 0 ? `${slug}-${slugSuffix}` : slug;
    const { data: existing } = await supabase
      .from('Organization')
      .select('id')
      .eq('slug', checkSlug)
      .single();

    if (!existing) {
      slug = checkSlug;
      break;
    }
    slugSuffix++;
  }

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from('Organization')
    .insert({
      name,
      slug,
      email,
      plan: 'free',
    })
    .select('id, slug')
    .single();

  if (orgError || !org) {
    throw new Error('Failed to create organization');
  }

  // Link user to organization as owner
  const { error: linkError } = await supabase
    .from('UserOrganization')
    .insert({
      userId,
      organizationId: org.id,
      role: 'owner',
      isDefault: true,
    });

  if (linkError) {
    // Rollback org creation
    await supabase.from('Organization').delete().eq('id', org.id);
    throw new Error('Failed to link user to organization');
  }

  // Create default VTO for organization
  await supabase.from('VTO').insert({
    organizationId: org.id,
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
    organizationId: org.id,
    companyName: name,
    email,
    marketingChannels: [
      { id: 'meta', label: 'Meta Ads', color: '#1877F2' },
      { id: 'google', label: 'Google Ads', color: '#EA4335' },
      { id: 'indicacao', label: 'Indicação', color: '#10B981' },
      { id: 'organico', label: 'Orgânico', color: '#8B5CF6' },
    ],
  });

  return { id: org.id, slug };
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

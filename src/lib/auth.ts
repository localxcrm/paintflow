import { prisma } from './prisma';
import { cookies } from 'next/headers';

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
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('paintpro_session')?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session.user;
  } catch {
    return null;
  }
}

// Create session for user
export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = getSessionExpiry();

  const session = await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return session;
}

// Delete session
export async function deleteSession(token: string) {
  try {
    await prisma.session.delete({
      where: { token },
    });
    return true;
  } catch {
    return false;
  }
}

// Clean up expired sessions
export async function cleanupExpiredSessions() {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

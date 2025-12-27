/**
 * Client-side auth utilities for iframe compatibility
 *
 * Since third-party cookies are blocked in iframes, we store
 * the session token in localStorage and include it in API requests.
 */

const SESSION_TOKEN_KEY = 'paintpro_session_token';
const ORG_ID_KEY = 'paintpro_org_id';

/**
 * Get session token from localStorage
 */
export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

/**
 * Get organization ID from localStorage
 */
export function getOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ORG_ID_KEY);
}

/**
 * Set session token in localStorage
 */
export function setSessionToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

/**
 * Set organization ID in localStorage
 */
export function setOrgId(orgId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ORG_ID_KEY, orgId);
}

/**
 * Clear auth data from localStorage
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(ORG_ID_KEY);
}

/**
 * Check if user is authenticated (has token in localStorage)
 */
export function isAuthenticated(): boolean {
  return !!getSessionToken();
}

/**
 * Create fetch wrapper that includes auth headers
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getSessionToken();
  const orgId = getOrgId();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (orgId) {
    headers.set('X-Organization-Id', orgId);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Still try to send cookies
  });
}

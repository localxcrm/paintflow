import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cookie names (must match supabase.ts)
const SESSION_COOKIE = 'paintpro_session';
const ORG_COOKIE = 'paintpro_org_id';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

// Routes that start with these paths are public
const publicPathPrefixes = [
  '/api/estimates/', // Allow public estimate viewing/signing
  '/_next',
  '/favicon',
];

// Routes that require authentication but NOT organization
const authOnlyRoutes = [
  '/select-org',
  '/criar-organizacao',
  '/api/organizations',
  '/api/user/organizations',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicPath = publicPathPrefixes.some(prefix => pathname.startsWith(prefix));

  // Allow public routes
  if (isPublicRoute || isPublicPath) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  // If no session and trying to access protected route
  if (!sessionToken) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if route requires only auth (not organization)
  const isAuthOnlyRoute = authOnlyRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  if (isAuthOnlyRoute) {
    return NextResponse.next();
  }

  // Check for organization cookie
  const organizationId = request.cookies.get(ORG_COOKIE)?.value;

  // If no organization selected and trying to access org-scoped route
  if (!organizationId) {
    // For API routes, return 400
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Organization not selected', code: 'NO_ORG' },
        { status: 400 }
      );
    }

    // For page routes, redirect to organization selection
    const selectOrgUrl = new URL('/select-org', request.url);
    selectOrgUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(selectOrgUrl);
  }

  // Both session and organization exist, allow the request
  // Add organization ID to response headers for easier access in API routes
  const response = NextResponse.next();
  response.headers.set('x-organization-id', organizationId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};

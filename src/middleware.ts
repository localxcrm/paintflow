import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cookie names (must match supabase.ts)
const SESSION_COOKIE = 'paintpro_session';
const ORG_COOKIE = 'paintpro_org_id';
const SUB_SESSION_COOKIE = 'paintpro_sub_session';

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback', // SSO callback for iframe auth
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  // GHL SSO routes
  '/api/ghl/generate-sso-url',
  '/api/auth/ghl',
  // Subcontractor public routes
  '/sub/login',
  '/sub/register',
  '/api/sub/login',
  '/api/sub/register',
];

// Routes that start with these paths are public
const publicPathPrefixes = [
  '/api/estimates/', // Allow public estimate viewing/signing
  '/api/os/',        // Allow public OS viewing (via token)
  '/api/webhooks/',  // Allow webhooks from external services (GHL, etc)
  '/os/',            // Public OS page
  '/_next',
  '/favicon',
];

// Routes that require authentication but NOT organization
const authOnlyRoutes = [
  '/select-org',
  '/criar-organizacao',
  '/api/organizations',
  '/api/user/organizations',
  '/admin',
];

// Subcontractor routes - require sub session only
const subRoutes = [
  '/sub/',
  '/api/sub/',
];

// Routes that can be accessed by both admins and subcontractors
const sharedApiRoutes = [
  '/api/upload',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight for /api/sub/* routes (mobile app)
  if (pathname.startsWith('/api/sub/')) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: corsHeaders });
    }
  }

  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicPath = publicPathPrefixes.some(prefix => pathname.startsWith(prefix));

  // Special handling for root path - redirect subcontractors to their dashboard
  if (pathname === '/' || pathname === '/login') {
    const subSessionToken = request.cookies.get(SUB_SESSION_COOKIE)?.value;
    if (subSessionToken) {
      // Subcontractor is logged in, redirect to their dashboard
      return NextResponse.redirect(new URL('/sub/dashboard', request.url));
    }
  }

  // Allow public routes
  if (isPublicRoute || isPublicPath) {
    return NextResponse.next();
  }

  // Check if it's a subcontractor route
  const isSubRoute = subRoutes.some(prefix => pathname.startsWith(prefix));

  if (isSubRoute) {
    // Subcontractor routes need sub session
    const subSessionToken = request.cookies.get(SUB_SESSION_COOKIE)?.value;

    if (!subSessionToken) {
      // No sub session
      if (pathname.startsWith('/api/sub/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401, headers: corsHeaders }
        );
      }
      // Redirect to sub login
      return NextResponse.redirect(new URL('/sub/login', request.url));
    }

    // Sub session exists, allow the request with CORS headers
    if (pathname.startsWith('/api/sub/')) {
      const response = NextResponse.next();
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
    return NextResponse.next();
  }

  // Regular admin routes - check for session cookie OR Authorization header
  // Authorization header is used for iframe compatibility (third-party cookies blocked)
  const authHeader = request.headers.get('authorization');
  const sessionToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : request.cookies.get(SESSION_COOKIE)?.value;

  // Also check X-Organization-Id header for iframe compatibility
  const organizationIdHeader = request.headers.get('x-organization-id');

  const subSessionToken = request.cookies.get(SUB_SESSION_COOKIE)?.value;

  // Check if it's a shared API route (accessible by both admins and subcontractors)
  const isSharedApiRoute = sharedApiRoutes.some(route => pathname.startsWith(route));

  // If a subcontractor (has sub session but no admin session) tries to access admin routes,
  // redirect them to the subcontractor dashboard (but allow shared routes)
  if (!sessionToken && subSessionToken) {
    // Allow shared API routes for subcontractors
    if (isSharedApiRoute) {
      return NextResponse.next();
    }

    // Subcontractor trying to access admin area - redirect to sub dashboard
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Access denied. This area is for company admins only.', code: 'SUB_ACCESS_DENIED' },
        { status: 403 }
      );
    }
    // Redirect to subcontractor dashboard
    return NextResponse.redirect(new URL('/sub/dashboard', request.url));
  }

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

  // Check for organization cookie OR header
  const organizationId = organizationIdHeader || request.cookies.get(ORG_COOKIE)?.value;

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

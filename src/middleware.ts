import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define the secret key - match the logic in src/lib/session.ts
const secret = process.env.SESSION_SECRET || process.env.GROQ_API_KEY || 'sparkle-dev-secret';
const secretKey = new TextEncoder().encode(secret);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't need auth checking
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/) ||
    pathname.startsWith('/auth/individual/signin') ||
    pathname.startsWith('/auth/individual/signup') ||
    pathname.startsWith('/auth/business/signup') ||
    pathname.startsWith('/api/auth')
  ) {
    // Allow access to onboarding page if they are authenticated, logic handled below
    if (pathname !== '/auth/onboarding' && !pathname.startsWith('/api/auth/complete-profile')) {
       return NextResponse.next();
    }
  }

  // Paths that strictly require auth
  // This encompasses /dashboard and any /api/ routes that aren't /api/auth
  const isProtectedRoute = pathname.startsWith('/dashboard') || (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth'));
  const isOnboardingRoute = pathname === '/auth/onboarding';

  // Get session
  const token = request.cookies.get('sparkle_session')?.value;
  let sessionPayload = null;

  if (token) {
    try {
      const verified = await jwtVerify(token, secretKey);
      sessionPayload = verified.payload;
    } catch {
      // Invalid token, treat as unauthenticated
    }
  }

  const isAuthenticated = !!sessionPayload;
  const isProfileCompleted = sessionPayload?.profileCompleted === true;

  // 1. If not authenticated and trying to access protected route, redirect to signin
  if (!isAuthenticated) {
    if (isProtectedRoute || isOnboardingRoute) {
      const signInUrl = new URL('/auth/individual/signin', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // 2. If authenticated, check onboarding status
  if (isAuthenticated) {
    // If trying to access protected route but profile is incomplete
    if (!isProfileCompleted && isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/onboarding', request.url));
    }

    // If trying to access onboarding but profile IS complete
    if (isProfileCompleted && isOnboardingRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

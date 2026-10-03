import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { CHANGE_PASSWORD_PATH, canAccessPath, homeForRole, isUserRole, portalForPath } from '@/lib/auth-routes';
import { SESSION_HINT_COOKIE } from '@/lib/session-hint';

// First line of route protection — an early redirect before any portal HTML
// is sent. It reads the first-party session hint (see lib/session-hint.ts),
// not the backend's refreshToken cookie, which lives on the API's domain and
// is invisible here in production. The authoritative check is AuthGuard,
// which verifies the session and role with the backend (/auth/me).
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hint = request.cookies.get(SESSION_HINT_COOKIE)?.value;
  const role = isUserRole(hint) ? hint : null;

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (portalForPath(pathname)) {
    if (!role) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    // Signed in, but this portal belongs to a different role.
    if (!canAccessPath(role, pathname)) {
      return redirectTo(homeForRole(role));
    }
    return NextResponse.next();
  }

  if (pathname === CHANGE_PASSWORD_PATH && !role) {
    return redirectTo('/login');
  }

  // Already signed in — skip the login form.
  if (pathname === '/login' && role) {
    return redirectTo(homeForRole(role));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/board/:path*', '/admin/:path*', '/login', '/change-password'],
};

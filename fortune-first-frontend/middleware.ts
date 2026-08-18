import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const { pathname } = request.nextUrl;

  // Protected Namespace Routes
  const isCustomerRoute = pathname.startsWith('/dashboard');
  const isBoardRoute = pathname.startsWith('/board');
  const isAdminRoute = pathname.startsWith('/admin');

  // Unauthenticated redirect to login
  if ((isCustomerRoute || isBoardRoute || isAdminRoute) && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect away from login if already authenticated
  if (pathname === '/login' && refreshToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/board/:path*', '/admin/:path*', '/login'],
};
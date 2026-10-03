// Single source of truth for which role may use which portal. Shared by the
// edge middleware (src/middleware.ts), the client-side AuthGuard and the
// login redirect, so the three can never disagree.

export type UserRole = 'customer' | 'investment_head' | 'business_head' | 'super_admin';

export const USER_ROLES: readonly UserRole[] = ['customer', 'investment_head', 'business_head', 'super_admin'];

export const PORTAL_ROLES: Record<string, readonly UserRole[]> = {
  '/admin': ['super_admin'],
  '/board': ['investment_head', 'business_head'],
  '/dashboard': ['customer'],
};

export const CHANGE_PASSWORD_PATH = '/change-password';

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function homeForRole(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return '/admin';
    case 'investment_head':
    case 'business_head':
      return '/board';
    default:
      return '/dashboard';
  }
}

/** The portal prefix ('/admin' | '/board' | '/dashboard') a path belongs to, or null if it's not a portal route. */
export function portalForPath(pathname: string): string | null {
  return Object.keys(PORTAL_ROLES).find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ?? null;
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  const portal = portalForPath(pathname);
  return portal === null || PORTAL_ROLES[portal].includes(role);
}

/**
 * Where to send a user after login: the page they originally asked for (the
 * middleware passes it as ?next=) if it's a same-site portal path their role
 * may open, otherwise their role's home.
 */
export function postLoginPath(role: UserRole, next: string | null | undefined): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && portalForPath(next) && canAccessPath(role, next)) {
    return next;
  }
  return homeForRole(role);
}

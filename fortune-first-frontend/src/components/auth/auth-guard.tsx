'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { CHANGE_PASSWORD_PATH, homeForRole, type UserRole } from '@/lib/auth-routes';

interface AuthGuardProps {
  /** Roles allowed to see this subtree. */
  allowedRoles: readonly UserRole[];
  /** The change-password page itself must render for users who still have to change it. */
  allowPendingPasswordChange?: boolean;
  children: React.ReactNode;
}

// Authoritative client-side route protection. Nothing under it renders until
// the backend has confirmed the session (/auth/me, or a fresh login), and then
// only for an allowed role. Otherwise the user is redirected:
//   no session            → /login?next=<current path>
//   wrong role            → their own portal's home
//   temporary password    → /change-password
// The edge middleware redirects earlier from a cookie hint, but only this
// guard relies on the backend's answer.
export function AuthGuard({ allowedRoles, allowPendingPasswordChange = false, children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, sessionStatus } = useAuth();

  const settled = sessionStatus === 'authenticated' || sessionStatus === 'unauthenticated';
  const roleAllowed = !!user && allowedRoles.includes(user.role);
  const mustChangePassword = !!user?.mustChangePassword && !allowPendingPasswordChange;
  const canRender = sessionStatus === 'authenticated' && roleAllowed && !mustChangePassword;

  useEffect(() => {
    if (!settled) return;
    if (sessionStatus === 'unauthenticated' || !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? '/')}`);
    } else if (!roleAllowed) {
      router.replace(homeForRole(user.role));
    } else if (mustChangePassword) {
      router.replace(CHANGE_PASSWORD_PATH);
    }
  }, [settled, sessionStatus, user, roleAllowed, mustChangePassword, pathname, router]);

  if (!canRender) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-brand-surface" role="status" aria-live="polite">
        <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  return <>{children}</>;
}

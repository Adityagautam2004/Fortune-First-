import type { UserRole } from './auth-routes';

// The real session is the backend's httpOnly `refreshToken` cookie, but that
// cookie lives on the API's domain — in production (Vercel frontend, Render
// API) the Next.js middleware can never see it. So the frontend keeps its own
// small, first-party "session hint" cookie holding just the signed-in role.
//
// It is ONLY a routing hint, never a security boundary: anyone could forge
// it, which at most shows them an empty portal shell. Every API call is still
// authorised by the backend, and AuthGuard re-verifies the session and role
// with /auth/me before any portal page renders.

export const SESSION_HINT_COOKIE = 'ff_session';

// Mirrors the refresh token lifetime set by the backend (auth.controller.js).
const MAX_AGE_SECONDS: Record<UserRole, number> = {
  customer: 7 * 24 * 60 * 60,
  investment_head: 24 * 60 * 60,
  business_head: 24 * 60 * 60,
  super_admin: 24 * 60 * 60,
};

function secureAttribute() {
  return typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
}

export function setSessionHint(role: UserRole) {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_HINT_COOKIE}=${role}; Path=/; Max-Age=${MAX_AGE_SECONDS[role]}; SameSite=Lax${secureAttribute()}`;
}

export function clearSessionHint() {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secureAttribute()}`;
}

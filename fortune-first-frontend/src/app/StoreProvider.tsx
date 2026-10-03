'use client';

import { Provider } from 'react-redux';
import { usePathname } from 'next/navigation';
import { store } from '@/store/store';
import { fetchCurrentUser } from '@/store/authSlice';
import { CHANGE_PASSWORD_PATH, portalForPath } from '@/lib/auth-routes';
import React, { useEffect } from 'react';

// Only rehydrate auth state on routes that actually require a session.
// Firing this on public pages like the landing page triggers a 401 from
// /auth/me for anonymous visitors, which the axios interceptor treats as an
// expired session and hard-redirects to /login — bouncing every anonymous
// visitor off the homepage.
function isProtectedRoute(pathname: string) {
  return portalForPath(pathname) !== null || pathname === CHANGE_PASSWORD_PATH;
}

// Checks the session once per page load (sessionStatus 'idle' = not checked
// yet). After that, login/logout keep the store in sync themselves, and an
// expired session is caught by the axios interceptor on the next API call.
function AuthBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && isProtectedRoute(pathname) && store.getState().auth.sessionStatus === 'idle') {
      store.dispatch(fetchCurrentUser());
    }
  }, [pathname]);

  return null;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthBootstrap />
      {children}
    </Provider>
  );
}
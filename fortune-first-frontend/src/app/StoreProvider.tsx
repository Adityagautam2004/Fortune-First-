'use client';

import { Provider } from 'react-redux';
import { usePathname } from 'next/navigation';
import { store } from '@/store/store';
import { fetchCurrentUser } from '@/store/authSlice';
import React, { useEffect } from 'react';

// Only rehydrate auth state on routes that actually require a session
// (mirrors middleware.ts's own route protection). Firing this on public
// pages like the landing page triggers a 401 from /auth/me for anonymous
// visitors, which the axios interceptor treats as an expired session and
// hard-redirects to /login — bouncing every anonymous visitor off the homepage.
function isProtectedRoute(pathname: string) {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/board') ||
    pathname.startsWith('/admin')
  );
}

function AuthBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && isProtectedRoute(pathname)) {
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
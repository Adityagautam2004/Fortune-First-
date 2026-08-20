'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { fetchCurrentUser } from '@/store/authSlice';
import React, { useEffect } from 'react';
function AuthBootstrap() {
  useEffect(() => {
    store.dispatch(fetchCurrentUser());
  }, []);
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
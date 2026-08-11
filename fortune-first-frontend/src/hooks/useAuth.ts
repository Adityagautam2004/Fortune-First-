'use client';

import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import { loginUser, fetchCurrentUser, logout, clearError } from '@/store/authSlice';
import type { LoginCredentials } from '@/types';
import { useCallback } from 'react';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const login = useCallback(
    (credentials: LoginCredentials) => dispatch(loginUser(credentials)),
    [dispatch]
  );

  const fetchMe = useCallback(() => dispatch(fetchCurrentUser()), [dispatch]);

  const signOut = useCallback(() => dispatch(logout()), [dispatch]);

  const resetError = useCallback(() => dispatch(clearError()), [dispatch]);

  return {
    ...auth,
    login,
    fetchMe,
    signOut,
    resetError,
  };
}

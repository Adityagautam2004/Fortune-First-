'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CircleCheck, Link2Off, Loader2 } from 'lucide-react';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { AuthShell } from '@/features/auth/components/auth-shell';
import {
  AUTH_LINK_CLASS,
  AuthAlert,
  AuthHeading,
  AuthPasswordField,
  AuthStatus,
  AuthSubmitButton,
} from '@/features/auth/components/auth-form-elements';

const MIN_LENGTH = 8;
const REDIRECT_SECONDS = 3;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? null;
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => router.push('/login'), REDIRECT_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [done, router]);

  if (!token) {
    return (
      <>
        <AuthStatus icon={Link2Off} tone="error" title="Invalid reset link">
          This password reset link is missing or incomplete. Please request a new one.
        </AuthStatus>
        <div className="mt-5 text-center text-xs">
          <Link href="/forgot-password" className={AUTH_LINK_CLASS}>
            Request a new reset link
          </Link>
        </div>
      </>
    );
  }

  if (done) {
    return (
      <AuthStatus icon={CircleCheck} tone="success" title="Password updated">
        Your password has been reset successfully. Redirecting you to login…
      </AuthStatus>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reset password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthHeading title="Create New Password" subtitle="Choose a strong password you haven't used before for this account." />
      {error && (
        <AuthAlert tone="error">
          {error}
          {/expired|invalid/i.test(error) && (
            <>
              {' '}
              <Link href="/forgot-password" className="font-semibold underline">
                Request a new link
              </Link>
            </>
          )}
        </AuthAlert>
      )}
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <AuthPasswordField
          id="reset-new-password"
          label="New Password"
          required
          minLength={MIN_LENGTH}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter a new password"
          hint={`At least ${MIN_LENGTH} characters.`}
        />
        <AuthPasswordField
          id="reset-confirm-password"
          label="Confirm Password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter the new password"
        />
        <AuthSubmitButton isLoading={loading}>Reset Password</AuthSubmitButton>
      </form>
    </>
  );
}

export default function ResetPasswordClient() {
  return (
    <AuthShell backHref="/login">
      <Suspense
        fallback={
          <div className="flex justify-center py-6" role="status">
            <Loader2 size={22} className="animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Loading…</span>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
      <div className="mt-5 text-center text-xs">
        <Link href="/login" className={`inline-flex items-center gap-1 ${AUTH_LINK_CLASS}`}>
          <ArrowLeft size={13} aria-hidden="true" /> Back to Login
        </Link>
      </div>
    </AuthShell>
  );
}

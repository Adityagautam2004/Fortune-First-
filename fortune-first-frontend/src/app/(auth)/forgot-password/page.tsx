'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MailCheck } from 'lucide-react';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { AuthShell } from '@/features/auth/components/auth-shell';
import {
  AUTH_LINK_CLASS,
  AuthAlert,
  AuthField,
  AuthHeading,
  AuthStatus,
  AuthSubmitButton,
} from '@/features/auth/components/auth-form-elements';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSentTo(email.trim());
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again in a moment.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell backHref="/login">
      {sentTo ? (
        <>
          <AuthStatus icon={MailCheck} tone="success" title="Check your inbox">
            If an account exists for <span className="font-semibold text-foreground">{sentTo}</span>, we&apos;ve sent a
            link to reset your password. The link expires in 15 minutes.
          </AuthStatus>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Didn&apos;t get it? Check your spam folder or{' '}
            <button type="button" onClick={() => setSentTo(null)} className={AUTH_LINK_CLASS}>
              try again
            </button>
            .
          </p>
        </>
      ) : (
        <>
          <AuthHeading
            title="Forgot Password?"
            subtitle="Enter the email linked to your account and we'll send you a link to reset your password."
          />
          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <AuthField
              id="forgot-email"
              label="Email ID"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email id"
            />
            <AuthSubmitButton isLoading={loading}>Send Reset Link</AuthSubmitButton>
          </form>
        </>
      )}

      <div className="mt-5 text-center text-xs">
        <Link href="/login" className={`inline-flex items-center gap-1 ${AUTH_LINK_CLASS}`}>
          <ArrowLeft size={13} aria-hidden="true" /> Back to Login
        </Link>
      </div>
    </AuthShell>
  );
}

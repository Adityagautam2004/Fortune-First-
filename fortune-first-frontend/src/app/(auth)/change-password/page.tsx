'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/auth-guard';
import { USER_ROLES } from '@/lib/auth-routes';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { AuthAlert, AuthHeading, AuthPasswordField, AuthSubmitButton } from '@/features/auth/components/auth-form-elements';

const MIN_LENGTH = 8;

function ChangePasswordForm() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      await api.post('/auth/change-password', { newPassword });
      // End this session so the user signs in fresh with the new password —
      // this also clears the cached "must change password" flag.
      await signOut();
      router.replace('/login');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update password. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell backHref="/">
      <AuthHeading
        title="Set a New Password"
        subtitle="For your security, replace your temporary password. You'll sign in again with the new one."
      />
      {error && <AuthAlert tone="error">{error}</AuthAlert>}
      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <AuthPasswordField
          id="new-password"
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
          id="confirm-password"
          label="Confirm Password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter the new password"
        />
        <AuthSubmitButton isLoading={submitting}>Update Password</AuthSubmitButton>
      </form>
    </AuthShell>
  );
}

export default function ChangePasswordPage() {
  return (
    <AuthGuard allowedRoles={USER_ROLES} allowPendingPasswordChange>
      <ChangePasswordForm />
    </AuthGuard>
  );
}

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus({ type: 'error', message: 'Missing reset token in URL.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await api.post('/auth/reset-password', { token, newPassword });
      setStatus({ type: 'success', message: res.data.message });
      setTimeout(() => router.push('/login'), 3000);
    } catch (error) {
      setStatus({
        type: 'error',
        message: getErrorMessage(error, 'Failed to reset password.'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">New Password</label>
        <input
          type="password" required minLength={8}
          value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-brand-border p-2 focus:border-brand-orange focus:outline-none"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit" disabled={loading}
        className="w-full rounded-md bg-brand-navy py-2.5 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Set New Password'}
      </button>

      {status.message && (
        <div className={`mt-4 p-3 text-sm rounded-md border ${
          status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {status.message}
          {status.type === 'success' && ' Redirecting to login...'}
        </div>
      )}
    </form>
  );
}

export default function ResetPasswordClient() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-surface p-4">
      <div className="w-full max-w-md rounded-xl border border-brand-border bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-brand-navy mb-2 text-center">Create New Password</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">Please enter your new secure password below.</p>

        <Suspense fallback={<div className="text-center p-4">Loading secure connection...</div>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-medium text-brand-orange hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

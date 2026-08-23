'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setStatus(res.data.message);
      setEmail('');
    } catch {
      setStatus('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-surface p-4">
      <div className="w-full max-w-md rounded-xl border border-brand-border bg-card p-8 shadow-md">
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Reset Password</h1>
        <p className="text-sm text-foreground mb-6 text-center">Enter your email address and we will send you a link to reset your password.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Email Address</label>
            <input
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-border p-2 focus:border-brand-orange focus:outline-none"
              placeholder="name@example.com"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full rounded-md bg-brand-navy py-2.5 font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {status && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-md border border-blue-200 dark:bg-blue-500/15 dark:text-blue-400">
            {status}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-medium text-brand-orange hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
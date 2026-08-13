'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { loginUser } from '@/store/authSlice';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const { login, error, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await login({ email, password });
    if (loginUser.fulfilled.match(result)) {
      const { role, mustChangePassword } = result.payload.user;
      if (mustChangePassword) {
        router.push('/change-password');
      } else if (role === 'customer') {
        router.push('/dashboard');
      } else if (role === 'investment_head' || role === 'business_head') {
        router.push('/board');
      } else if (role === 'super_admin') {
        router.push('/admin');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-surface p-4">
      <div className="w-full max-w-md rounded-xl border border-brand-border bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand-navy">Fortune First</h1>
          <p className="text-sm text-gray-600">Sign in to access your portal</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-border p-2 focus:border-brand-orange focus:outline-none"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-border p-2 focus:border-brand-orange focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-brand-navy py-2.5 font-medium text-white hover:bg-opacity-90 transition disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
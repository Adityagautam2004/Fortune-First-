'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { loginUser } from '@/store/authSlice';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();
  const { login, error, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
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
    <>
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-extrabold text-gray-900">Welcome Back</h2>
        <p className="mt-0.5 text-xs text-gray-500">Login to access your account</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
      )}

      <form className="space-y-3.5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-800">Email ID</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email id"
            className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-800">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-[#f97316] focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-gray-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-[#f97316] focus:ring-orange-200"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-medium text-[#f97316] hover:text-[#ea580c]">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full justify-center rounded-xl border border-transparent bg-[#f97316] px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#ea580c] focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:ring-offset-2"
        >
          Login
        </Button>
      </form>
    </>
  );
}

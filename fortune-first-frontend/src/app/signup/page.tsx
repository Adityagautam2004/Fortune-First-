'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/src/components/ui/Button';
import { Eye, EyeOff, AlertCircle, ChevronLeft } from 'lucide-react';
import Image from 'next/image';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!name.trim()) {
      setNameError('Please enter your full name');
      hasError = true;
    }
    if (!email.trim()) {
      setEmailError('Please enter a valid email id');
      hasError = true;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/login');
    }, 1000);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Full-screen Hero Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Hero_image.png"
          alt="Fortune First Background"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Back arrow */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-all"
        aria-label="Go back"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Signup Card — compact, same width as login */}
      <div className="relative z-10 w-full max-w-[380px] mx-4 my-6">
        <div className="bg-white rounded-2xl shadow-2xl px-7 py-8">
          {/* Logo + Brand */}
          <div className="flex flex-col items-center gap-1.5 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 shadow-sm">
              <Image
                src="/logo_img.png"
                alt="Fortune First Logo"
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-wide">Fortune First</span>
          </div>

          {/* Heading */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-extrabold text-gray-900">Create Account</h2>
            <p className="mt-0.5 text-xs text-gray-500">Sign up to get started</p>
          </div>

          {/* Form */}
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(''); }}
                placeholder="Enter your full name"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                  nameError
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-orange-200 focus:border-[#f97316]'
                }`}
              />
              {nameError && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-500">{nameError}</p>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Email ID</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                placeholder="Enter your email id"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                  emailError
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-orange-200 focus:border-[#f97316]'
                }`}
              />
              {emailError && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-500">{emailError}</p>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Create a password"
                  className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                    passwordError
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-orange-200 focus:border-[#f97316]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {passwordError && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-500">{passwordError}</p>
                </div>
              )}
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              isLoading={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-bold tracking-widest text-white bg-[#f97316] hover:bg-[#ea580c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f97316] transition-colors uppercase"
            >
              SIGN UP
            </Button>

            {/* OR Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Already have account */}
            <p className="text-center text-xs text-gray-700">
              Already have an account?{' '}
              <a href="/login" className="font-semibold text-[#f97316] hover:text-[#ea580c] transition-colors">
                Login
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', { newPassword });
      alert('Password updated. Please log in again.');
      router.push('/login');
    } catch {
      alert('Failed to update password.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-surface">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-96">
        <h2 className="text-xl font-bold text-brand-navy mb-4">Update Security Credentials</h2>
        <p className="text-sm text-gray-600 mb-4">You must change your temporary admin-assigned password to continue.</p>
        <input 
          type="password" required placeholder="New Password" 
          value={newPassword} onChange={e => setNewPassword(e.target.value)}
          className="w-full border p-2 rounded mb-4 focus:border-brand-orange" 
        />
        <button type="submit" className="w-full bg-brand-navy text-white py-2 rounded">Secure Account</button>
      </form>
    </div>
  );
}
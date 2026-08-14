'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const ROLE_LABELS: Record<string, string> = {
  customer: 'Customer',
  investment_head: 'Investment Head',
  business_head: 'Business Head',
  super_admin: 'Super Admin',
};

interface ProfileData {
  name: string;
  email: string;
}

export function DashboardTopbar() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/customer/profile')
      .then((res) => {
        if (!cancelled) setProfile(res.data.data);
      })
      .catch(() => {
        // Fall back silently to whatever is already in the auth store
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = profile?.name || user?.name || 'Customer';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <header className="flex items-center justify-between gap-4 border-b border-brand-border bg-white px-6 py-4">
      <div className="relative w-full max-w-sm">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Search anything"
          className="w-full rounded-full border border-brand-border bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex shrink-0 items-center gap-3 rounded-full border border-brand-border py-1.5 pl-1.5 pr-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initial}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">{(user?.role && ROLE_LABELS[user.role]) || 'Customer'}</p>
        </div>
      </div>
    </header>
  );
}

'use client';

import { Search, Bell, HelpCircle, Menu } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';

interface AdminTopbarProps {
  onOpenMenu: () => void;
}

export function AdminTopbar({ onOpenMenu }: AdminTopbarProps) {
  const { user } = useAuth();

  const displayName = user?.name || 'Admin';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'A';

  return (
    <header className="flex items-center justify-between gap-3 border-b border-brand-border bg-white px-4 py-2.5 md:gap-4 md:px-5">
      <div className="flex flex-1 items-center gap-2">
        <button
          onClick={onOpenMenu}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-muted hover:text-primary md:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <div className="relative w-full max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search anything..."
            className="w-full rounded-full border border-brand-border bg-white py-1.5 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          className="hidden h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-muted hover:text-primary sm:flex"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <button
          className="hidden h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-muted hover:text-primary sm:flex"
          aria-label="Help"
        >
          <HelpCircle size={16} />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-brand-border py-1 pl-1 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initial}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}

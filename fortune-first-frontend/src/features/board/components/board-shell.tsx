'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { BoardSidebar } from './board-sidebar';

const ROLE_LABELS: Record<string, string> = {
  investment_head: 'Investment Head',
  business_head: 'Board Member',
};

export function BoardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const displayName = user?.name || 'Board Member';

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface">
      <BoardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Board has no separate page title bar — this is its topbar,
            matching AdminTopbar's shape: mobile menu trigger on the left
            (hidden at md+, sidebar takes over), theme toggle + profile on
            the right, always visible. */}
        <header className="flex items-center justify-between gap-3 border-b border-brand-border bg-card px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary md:hidden"
            >
              <Menu size={20} />
            </button>
            <span className="text-base font-bold text-foreground md:hidden">Fortune First</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-3 rounded-full border border-brand-border py-1.5 pl-1.5 pr-4">
              <Avatar src={user?.profilePictureUrl} name={displayName} size={36} />
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{(user?.role && ROLE_LABELS[user.role]) || 'Board Member'}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

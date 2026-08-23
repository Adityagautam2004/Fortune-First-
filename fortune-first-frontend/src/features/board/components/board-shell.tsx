'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { BoardSidebar } from './board-sidebar';

export function BoardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface">
      <BoardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Board has no full desktop topbar by design — this slim bar hosts
            the mobile menu trigger (hidden at md+, sidebar takes over) and
            stays visible at every width purely so the theme toggle has a
            reachable home on desktop too. */}
        <header className="flex items-center justify-between gap-3 border-b border-brand-border bg-card px-4 py-3">
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
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

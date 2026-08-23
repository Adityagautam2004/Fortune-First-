'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';

import { BoardSidebar } from './board-sidebar';

export function BoardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface">
      <BoardSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Board has no desktop topbar by design — this slim bar only exists
            to host the mobile menu trigger, since the sidebar hides below md. */}
        <header className="flex items-center gap-3 border-b border-brand-border bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-muted hover:text-primary"
          >
            <Menu size={20} />
          </button>
          <span className="text-base font-bold text-gray-900">Fortune First</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

'use client';

import { Search, RotateCcw } from 'lucide-react';

interface PayoutFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export function PayoutFilters({ search, onSearchChange, onReset }: PayoutFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-muted p-5 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search clients, by or ID..."
          className="w-full rounded-lg border border-brand-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <button
        onClick={onReset}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        <RotateCcw size={14} />
        Reset Filters
      </button>
    </div>
  );
}

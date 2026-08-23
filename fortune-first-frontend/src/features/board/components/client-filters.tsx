'use client';

import { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';

export interface ClientFiltersState {
  search: string;
  relationshipManager: string;
  status: string;
}

const EMPTY_FILTERS: ClientFiltersState = { search: '', relationshipManager: 'all', status: 'all' };

interface ClientFiltersProps {
  relationshipManagers: string[];
  onApply: (filters: ClientFiltersState) => void;
}

export function ClientFilters({ relationshipManagers, onApply }: ClientFiltersProps) {
  const [draft, setDraft] = useState<ClientFiltersState>(EMPTY_FILTERS);

  const set = (patch: Partial<ClientFiltersState>) => setDraft((prev) => ({ ...prev, ...patch }));

  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
    onApply(EMPTY_FILTERS);
  };

  return (
    <div className="rounded-2xl border border-primary/15 bg-muted p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={draft.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search client name or ID"
            className="w-full rounded-lg border border-brand-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">Relationship Manager</label>
          <select
            value={draft.relationshipManager}
            onChange={(e) => set({ relationshipManager: e.target.value })}
            className="w-full rounded-lg border border-brand-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">All</option>
            {relationshipManagers.map((rm) => (
              <option key={rm} value={rm}>
                {rm}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-foreground">Client Status</label>
          <select
            value={draft.status}
            onChange={(e) => set({ status: e.target.value })}
            className="w-full rounded-lg border border-brand-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={() => onApply(draft)}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            Reset <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

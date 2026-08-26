import { Search } from 'lucide-react';

export interface TransactionFiltersState {
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  search: string;
}

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  onChange: (filters: TransactionFiltersState) => void;
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'investment', label: 'Investment' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'payout', label: 'Payout' },
];

// Spans every status value across all three transaction types — a plain
// string match against Transaction.status, so no per-type branching needed.
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'exited', label: 'Exited' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'voided', label: 'Voided' },
];

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  const set = (patch: Partial<TransactionFiltersState>) => onChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-1 gap-5 rounded-2xl border border-primary/15 bg-muted p-5 sm:grid-cols-2 lg:grid-cols-6">
      <div className="sm:col-span-2 lg:col-span-2">
        <label className="mb-1.5 block text-sm font-semibold text-foreground">Date Range</label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => set({ startDate: e.target.value })}
            className="w-full min-w-0 rounded-lg border border-brand-border bg-card px-2.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <span className="shrink-0 text-muted-foreground">-</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => set({ endDate: e.target.value })}
            className="w-full min-w-0 rounded-lg border border-brand-border bg-card px-2.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-foreground">Type</label>
        <select
          value={filters.type}
          onChange={(e) => set({ type: e.target.value })}
          className="w-full rounded-lg border border-brand-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-foreground">Status</label>
        <select
          value={filters.status}
          onChange={(e) => set({ status: e.target.value })}
          className="w-full rounded-lg border border-brand-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2 lg:col-span-2">
        <label className="mb-1.5 block text-sm font-semibold text-foreground">Search</label>
        <div className="relative">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search transaction"
            className="w-full rounded-lg border border-brand-border bg-card px-3 py-2 pr-9 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

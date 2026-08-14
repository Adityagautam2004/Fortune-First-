import { Search } from 'lucide-react';

export interface TransactionFiltersState {
  startDate: string;
  endDate: string;
  status: string;
  search: string;
}

interface TransactionFiltersProps {
  filters: TransactionFiltersState;
  onChange: (filters: TransactionFiltersState) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'skipped', label: 'Skipped' },
];

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  const set = (patch: Partial<TransactionFiltersState>) => onChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-1 gap-5 rounded-2xl border border-primary/15 bg-muted p-5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Date Range</label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => set({ startDate: e.target.value })}
            className="w-full rounded-lg border border-brand-border bg-white px-2.5 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => set({ endDate: e.target.value })}
            className="w-full rounded-lg border border-brand-border bg-white px-2.5 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Status</label>
        <select
          value={filters.status}
          onChange={(e) => set({ status: e.target.value })}
          className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2 lg:col-span-2">
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Search</label>
        <div className="relative">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search transaction"
            className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 pr-9 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none"
          />
          <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

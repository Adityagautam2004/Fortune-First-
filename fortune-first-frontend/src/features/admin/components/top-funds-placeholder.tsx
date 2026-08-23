import { PieChart } from 'lucide-react';

export function TopFundsPlaceholder() {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-brand-border bg-card p-3">
      <h3 className="mb-1.5 text-sm font-bold text-foreground">Top Performing Funds (YTD)</h3>

      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Fund Name</span>
        <span>Returns (YTD)</span>
      </div>

      <div className="flex flex-1 min-h-[70px] flex-col items-center justify-center gap-1 rounded-xl bg-brand-surface px-2 text-center">
        <PieChart size={16} className="shrink-0 text-muted-foreground" />
        <p className="line-clamp-2 max-w-[240px] text-xs leading-snug text-muted-foreground">
          Fund-level performance isn&apos;t tracked — investments aren&apos;t split by fund/plan.
        </p>
      </div>
    </div>
  );
}

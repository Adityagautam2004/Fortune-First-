import Link from 'next/link';
import { ImageIcon } from 'lucide-react';

import type { AdminTransactionRow } from '../types';

const TYPE_STYLES: Record<string, string> = {
  investment: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  withdrawal: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  payout: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
};

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface RecentTransactionsTableProps {
  rows: AdminTransactionRow[];
}

// Last 5 rows from the same unified investment + withdrawal + payout feed as
// the full Transaction History page (/admin/transactions) — same columns,
// same styling, just capped to 5 and non-paginated.
export function RecentTransactionsTable({ rows }: RecentTransactionsTableProps) {
  const recent = rows.slice(0, 5);

  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-brand-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Recent Transactions</h3>
        <Link
          href="/admin/transactions"
          className="rounded-lg border border-primary/30 bg-muted px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          View All Transactions
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">Type</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">Client</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">Amount</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">Date</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">Status</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {recent.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-muted-foreground">
                  No transactions yet.
                </td>
              </tr>
            ) : (
              recent.map((t) => (
                <tr key={`${t.type}-${t.id}`}>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${TYPE_STYLES[t.type] || 'bg-muted text-muted-foreground'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 font-medium text-foreground">{t.customer_name}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-foreground">{formatRupees(Number(t.amount))}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-foreground">{formatDate(t.date)}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 capitalize text-foreground">{t.status}</td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    {t.screenshot_url ? (
                      <a href={t.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <ImageIcon size={13} /> View
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

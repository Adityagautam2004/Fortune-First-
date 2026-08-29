'use client';

import { useEffect, useState } from 'react';

import api from '@/lib/api';
import type { AdminPayoutRow, PaginationMeta } from './types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  skipped: 'bg-muted text-muted-foreground',
  voided: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface PayoutHistoryPageProps {
  /** GET /admin/payouts (super_admin) by default; the board panel's Monthly
   * Payout page passes GET /board/payouts instead — same shape, scoped for
   * investment_head/business_head server-side. */
  endpoint?: string;
}

// Flat, firm-wide record of every processed payout — fed by GET /admin/payouts,
// which replaced the old per-investment-only endpoint nothing in the
// frontend actually called.
export function PayoutHistoryPage({ endpoint = '/admin/payouts' }: PayoutHistoryPageProps) {
  const [payouts, setPayouts] = useState<AdminPayoutRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(endpoint, { params: { page, limit: 15 } })
      .then((res) => {
        setPayouts(res.data.data.payouts || []);
        setPagination(res.data.data.pagination);
      })
      .catch((error) => console.error('Failed to load payout history', error))
      .finally(() => setLoading(false));
  }, [endpoint, page]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">A record of every processed payout, across all clients.</p>

      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted text-foreground">
              <th className="whitespace-nowrap px-6 py-3 font-medium">Client</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Month</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Return %</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Payout Amount</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">Loading...</td></tr>
            ) : payouts.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">No payouts processed yet.</td></tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{p.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{p.customer_email}</p>
                  </td>
                  <td className="px-6 py-4 text-foreground">{MONTH_LABELS[p.month - 1]} {p.year}</td>
                  <td className="px-6 py-4 text-foreground">{Number(p.return_pct).toFixed(2)}%</td>
                  <td className="px-6 py-4 font-medium text-foreground">{formatRupees(Number(p.payout_amount))}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[p.payout_status] || 'bg-muted text-muted-foreground'}`}>
                      {p.payout_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

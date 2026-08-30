'use client';

import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';

import api from '@/lib/api';

interface BoardWithdrawalRow {
  id: string;
  amount: number | string;
  status: string;
  withdrawal_date: string;
  customer_name: string;
  payment_screenshot_url?: string | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// investment_head sees only their own assigned clients; business_head sees
// everyone — scoping happens server-side in GET /board/withdrawals. This is
// view-only: only super_admin can complete/reject (PATCH /admin/withdrawals),
// so there's no decision UI here, only status.
export function BoardWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<BoardWithdrawalRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/board/withdrawals', { params: { page, limit: 15, status: statusFilter === 'all' ? undefined : statusFilter } })
      .then((res) => {
        setWithdrawals(res.data.data.withdrawals || []);
        setPagination(res.data.data.pagination);
      })
      .catch((error) => console.error('Failed to load withdrawals', error))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Withdrawal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every withdrawal request submitted for your clients. Pending ones await admin review.
        </p>
      </div>

      <div className="flex items-center justify-end">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-brand-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-brand-border bg-card px-6 py-10 text-center text-muted-foreground">Loading...</div>
      ) : withdrawals.length === 0 ? (
        <div className="rounded-2xl border border-brand-border bg-card px-6 py-10 text-center text-muted-foreground">No withdrawals found.</div>
      ) : (
        <>
          {/* Card list — mobile only, so every field is visible without side-scrolling. */}
          <div className="space-y-3 md:hidden">
            {withdrawals.map((w) => (
              <div key={w.id} className="rounded-2xl border border-brand-border bg-card p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">{w.customer_name}</p>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[w.status] || 'bg-muted text-muted-foreground'}`}>
                    {w.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium text-foreground">{formatRupees(Number(w.amount))}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-foreground">{formatDate(w.withdrawal_date)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Proof</span>
                    {w.payment_screenshot_url ? (
                      <a href={w.payment_screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <ImageIcon size={14} /> View
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table — tablet/desktop only. */}
          <div className="hidden overflow-x-auto rounded-2xl border border-brand-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-muted text-foreground">
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Client</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Amount</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Date</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Status</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="px-6 py-4 font-medium text-foreground">{w.customer_name}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{formatRupees(Number(w.amount))}</td>
                    <td className="px-6 py-4 text-foreground">{formatDate(w.withdrawal_date)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[w.status] || 'bg-muted text-muted-foreground'}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {w.payment_screenshot_url ? (
                        <a href={w.payment_screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <ImageIcon size={14} /> View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

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

'use client';

import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';

import api from '@/lib/api';
import type { AdminTransactionRow, PaginationMeta } from './types';

const TYPE_STYLES: Record<string, string> = {
  investment: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  withdrawal: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  payout: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
};

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Firm-wide, all-clients view of every investment + withdrawal + payout,
// via the single unified GET /admin/transactions endpoint.
export function TransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransactionRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/transactions', { params: { page, limit: 15, type: typeFilter === 'all' ? undefined : typeFilter } })
      .then((res) => {
        setTransactions(res.data.data.transactions || []);
        setPagination(res.data.data.pagination);
      })
      .catch((error) => console.error('Failed to load transactions', error))
      .finally(() => setLoading(false));
  }, [page, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Every investment, withdrawal, and payout across all clients, newest first.</p>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-brand-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="all">All types</option>
          <option value="investment">Investments</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="payout">Payouts</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted text-foreground">
              <th className="whitespace-nowrap px-6 py-3 font-medium">Type</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Client</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Amount</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Date</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Status</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">Loading...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No transactions found.</td></tr>
            ) : (
              transactions.map((t) => (
                <tr key={`${t.type}-${t.id}`}>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${TYPE_STYLES[t.type] || 'bg-muted text-muted-foreground'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{t.customer_name}</td>
                  <td className="px-6 py-4 font-medium text-foreground">{formatRupees(Number(t.amount))}</td>
                  <td className="px-6 py-4 text-foreground">{formatDate(t.date)}</td>
                  <td className="px-6 py-4 capitalize text-foreground">{t.status}</td>
                  <td className="px-6 py-4">
                    {t.screenshot_url ? (
                      <a href={t.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <ImageIcon size={14} /> View
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

'use client';

import { useState, useMemo } from 'react';
import { Filter, Download, ImageIcon } from 'lucide-react';

import { downloadCsv } from '@/lib/csv';
import type { ClientPayout } from '../types';

const PAGE_SIZE = 5;

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  skipped: 'bg-muted text-muted-foreground',
  voided: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatPeriod(p: ClientPayout) {
  return `${MONTH_LABELS[Number(p.month) - 1]} ${p.year}`;
}

interface PayoutHistoryTableProps {
  payouts: ClientPayout[];
}

export function PayoutHistoryTable({ payouts }: PayoutHistoryTableProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => payouts.filter((p) => statusFilter === 'all' || p.payout_status === statusFilter),
    [payouts, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  const cycleStatusFilter = () => {
    const order = ['all', 'paid', 'pending', 'skipped', 'voided'];
    const next = order[(order.indexOf(statusFilter) + 1) % order.length];
    setStatusFilter(next);
    setPage(1);
  };

  const handleDownload = () => {
    downloadCsv(
      'payout_history.csv',
      filtered.map((p) => ({
        Month: formatPeriod(p),
        'Payout Date': formatDate(p.payout_date),
        'Invested Amount (INR)': Number(p.invested_amount),
        'Return %': Number(p.return_pct),
        'Payout Amount (INR)': Number(p.payout_amount),
        Status: p.payout_status,
      }))
    );
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-card">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-lg font-bold text-foreground">Payout History</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={cycleStatusFilter}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold capitalize text-white transition-colors hover:bg-primary/90"
            title="Cycle status filter: All / Paid / Pending / Skipped / Voided"
          >
            <Filter size={13} />
            {statusFilter === 'all' ? 'Filters' : statusFilter}
          </button>
          <button
            onClick={handleDownload}
            disabled={filtered.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Download payout history"
          >
            <Download size={15} />
          </button>
        </div>
      </div>

      {pageRows.length === 0 ? (
        <div className="px-6 py-10 text-center text-muted-foreground">No payouts recorded yet.</div>
      ) : (
        <>
          {/* Card list — mobile only, so every field is visible without side-scrolling. */}
          <div className="space-y-3 px-6 pb-2 md:hidden">
            {pageRows.map((p) => (
              <div key={p.id} className="rounded-2xl border border-brand-border p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{formatPeriod(p)}</span>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      STATUS_STYLES[p.payout_status] || 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {p.payout_status}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Payout Date</span>
                    <span className="text-foreground">{formatDate(p.payout_date)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Invested</span>
                    <span className="text-foreground">{formatRupees(Number(p.invested_amount))}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Return %</span>
                    <span className="text-foreground">{Number(p.return_pct).toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Payout</span>
                    <span className="font-medium text-foreground">{formatRupees(Number(p.payout_amount))}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Proof</span>
                    {p.payment_screenshot_url ? (
                      <a
                        href={p.payment_screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
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
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-muted text-foreground">
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Month</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Payout Date</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Invested</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Return %</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Payout</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Status</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {pageRows.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-foreground">{formatPeriod(p)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-foreground">{formatDate(p.payout_date)}</td>
                    <td className="px-6 py-4 text-foreground">{formatRupees(Number(p.invested_amount))}</td>
                    <td className="px-6 py-4 text-foreground">{Number(p.return_pct).toFixed(2)}%</td>
                    <td className="px-6 py-4 font-medium text-foreground">{formatRupees(Number(p.payout_amount))}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          STATUS_STYLES[p.payout_status] || 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {p.payout_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.payment_screenshot_url ? (
                        <a
                          href={p.payment_screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
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

      <div className="flex flex-col gap-3 border-t border-brand-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length === 0 ? 'No entries' : `Showing ${rangeStart} to ${rangeEnd} of ${filtered.length} entries`}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                n === page ? 'bg-primary text-white' : 'border border-brand-border text-foreground hover:bg-muted'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

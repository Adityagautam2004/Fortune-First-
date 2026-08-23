'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { StatusBadge } from '@/components/ui/Badge';
import type { MonthlyReturn } from '@/types';

const MONTH_LABELS = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const PAGE_SIZE = 8;

function formatDate(record: MonthlyReturn) {
  if (record.payout_date) {
    return new Date(record.payout_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
  return `${MONTH_LABELS[record.month]} ${record.year}`;
}

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface TransactionTableProps {
  history: MonthlyReturn[];
}

export function TransactionTable({ history }: TransactionTableProps) {
  const [page, setPage] = useState(1);
  const [prevHistory, setPrevHistory] = useState(history);

  if (history !== prevHistory) {
    setPrevHistory(history);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [history, page]
  );

  const rangeStart = history.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, history.length);

  return (
    <div className="rounded-2xl border border-brand-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Activity</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                  No transactions match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map((record, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-foreground">{formatDate(record)}</td>
                  <td className="px-6 py-4 font-medium text-foreground">Monthly Payout</td>
                  <td className="px-6 py-4 text-foreground">{formatRupees(Number(record.payout_amount))}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={record.payout_status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-brand-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {history.length === 0
            ? 'No transactions'
            : `Showing ${rangeStart} to ${rangeEnd} of ${history.length} transactions`}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                n === page ? 'bg-primary text-white' : 'border border-brand-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

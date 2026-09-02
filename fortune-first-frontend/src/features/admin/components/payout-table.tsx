'use client';

import { useState, useMemo } from 'react';
import { Info } from 'lucide-react';

import { calculatePayout } from '../lib/calculate-payout';
import { MarkPaidModal } from './mark-paid-modal';
import type { PendingPayout } from '../types';

const PAGE_SIZE = 6;
const DEFAULT_RETURN_PCT = 2.0;

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface PayoutTableProps {
  investments: PendingPayout[];
  month: number;
  year: number;
  onMarkPaid: (customerId: string, returnPct: number, screenshot: File | null) => Promise<void>;
}

export function PayoutTable({ investments, month, year, onMarkPaid }: PayoutTableProps) {
  const [page, setPage] = useState(1);
  const [returnPcts, setReturnPcts] = useState<Record<string, number>>({});
  const [confirming, setConfirming] = useState<PendingPayout | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(investments.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => investments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [investments, page]
  );
  const rangeStart = investments.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, investments.length);

  const getReturnPct = (investmentId: string) => returnPcts[investmentId] ?? DEFAULT_RETURN_PCT;

  const confirmingPayoutAmount = useMemo(() => {
    if (!confirming) return 0;
    const invDate = new Date(confirming.earliest_investment_date);
    const isFirstMonth = invDate.getMonth() + 1 === month && invDate.getFullYear() === year;
    return calculatePayout(Number(confirming.amount), getReturnPct(confirming.customer_id), confirming.week_of_month, null, isFirstMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirming, month, year]);

  const handleConfirm = async (screenshot: File | null) => {
    if (!confirming) return;
    setSubmitting(true);
    try {
      await onMarkPaid(confirming.customer_id, getReturnPct(confirming.customer_id), screenshot);
      setConfirming(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="whitespace-nowrap px-6 py-3 font-medium">
                Client Name
                <br />
                <span className="font-normal text-muted-foreground">Client ID</span>
              </th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">
                Total Invested <Info size={12} className="ml-1 inline text-muted-foreground" />
              </th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Return</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">
                Payout Amount <Info size={12} className="ml-1 inline text-muted-foreground" />
                <br />
                <span className="font-normal text-muted-foreground">(Auto calculated)</span>
              </th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Status</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                  No pending payouts for this period.
                </td>
              </tr>
            ) : (
              pageRows.map((inv) => {
                const returnPct = getReturnPct(inv.customer_id);
                const invDate = new Date(inv.earliest_investment_date);
                const isFirstMonth = invDate.getMonth() + 1 === month && invDate.getFullYear() === year;
                const payoutAmount = calculatePayout(Number(inv.amount), returnPct, inv.week_of_month, null, isFirstMonth);

                return (
                  <tr key={inv.customer_id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{inv.client_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.customer_id.slice(0, 8).toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-4 text-foreground">{formatRupees(Number(inv.amount))}</td>
                    <td className="px-6 py-4">
                      <div className="relative w-24">
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          value={returnPct}
                          onChange={(e) =>
                            setReturnPcts((prev) => ({ ...prev, [inv.customer_id]: Number(e.target.value) }))
                          }
                          className="w-full rounded-lg border border-brand-border px-3 py-1.5 pr-6 text-sm text-foreground focus:border-primary focus:outline-none"
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          %
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">{formatRupees(payoutAmount)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setConfirming(inv)}
                        className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mark Paid
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-brand-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {investments.length === 0
            ? 'No clients'
            : `Showing ${rangeStart} to ${rangeEnd} of ${investments.length} clients`}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹
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
            ›
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 border-t border-brand-border bg-muted px-6 py-4 text-sm text-foreground">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" />
        <p>Enter the return percentage (%) for each client. Click &quot;Mark Paid&quot; to process the payout.</p>
      </div>

      <MarkPaidModal
        isOpen={!!confirming}
        clientName={confirming?.client_name ?? ''}
        payoutAmount={confirmingPayoutAmount}
        submitting={submitting}
        onClose={() => setConfirming(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

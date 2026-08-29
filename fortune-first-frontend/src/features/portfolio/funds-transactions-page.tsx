'use client';

import { useEffect, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from 'lucide-react';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { BoardStatTile } from '@/features/board/components/board-stat-tile';
import { BusinessHeadFilter } from './components/business-head-filter';
import type { FundsTransactionSummary, PaginationMeta, StockTransaction } from './types';

function formatRupees(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
];

const OUTCOME_OPTIONS = [
  { value: '', label: 'All Outcomes' },
  { value: 'profit', label: 'Profit' },
  { value: 'loss', label: 'Loss' },
];

// Shared by /board/funds-transactions and /admin/funds-transactions —
// view-only for every role; the underlying buy/sell actions live on the
// portfolio dashboard.
export function FundsTransactionsPage() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [summary, setSummary] = useState<FundsTransactionSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [businessHeadId, setBusinessHeadId] = useState('');
  const [type, setType] = useState('');
  const [outcome, setOutcome] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/board/funds-transactions', {
        params: {
          page,
          limit: 20,
          businessHeadId: businessHeadId || undefined,
          type: type || undefined,
          outcome: outcome || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      })
      .then((res) => {
        setTransactions(res.data.data.transactions || []);
        setSummary(res.data.data.summary);
        setPagination(res.data.data.pagination);
      })
      .catch((error) => console.error('Failed to load funds transactions', error))
      .finally(() => setLoading(false));
  }, [page, businessHeadId, type, outcome, dateFrom, dateTo]);

  const resetToPageOne = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Funds Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every stock buy and sell recorded by business heads.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BoardStatTile icon={ArrowUpCircle} label="Total Buys" value={summary ? `${summary.buy_count} · ${formatRupees(summary.total_buy_value)}` : '—'} />
        <BoardStatTile icon={ArrowDownCircle} label="Total Sells" value={summary ? `${summary.sell_count} · ${formatRupees(summary.total_sell_value)}` : '—'} />
        <BoardStatTile icon={TrendingUp} label="Realized Profit" value={summary ? formatRupees(summary.total_profit) : '—'} />
        <BoardStatTile icon={TrendingDown} label="Realized Loss" value={summary ? formatRupees(Math.abs(summary.total_loss)) : '—'} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <BusinessHeadFilter value={businessHeadId} onChange={resetToPageOne(setBusinessHeadId)} />
        <select
          value={type}
          onChange={(e) => resetToPageOne(setType)(e.target.value)}
          className="rounded-lg border border-brand-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          {TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select
          value={outcome}
          onChange={(e) => resetToPageOne(setOutcome)(e.target.value)}
          className="rounded-lg border border-brand-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          {OUTCOME_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => resetToPageOne(setDateFrom)(e.target.value)}
          className="rounded-lg border border-brand-border bg-card px-3 py-1.5 text-sm text-foreground"
          aria-label="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => resetToPageOne(setDateTo)(e.target.value)}
          className="rounded-lg border border-brand-border bg-card px-3 py-1.5 text-sm text-foreground"
          aria-label="To date"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted text-foreground">
              <th className="whitespace-nowrap px-6 py-3 font-medium">Stock</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Type</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Qty</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Price</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">P&amp;L</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Business Head</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">Loading...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">No transactions found.</td></tr>
            ) : (
              transactions.map((txn) => {
                const pnl = txn.profit_loss !== null ? Number(txn.profit_loss) : null;
                return (
                  <tr key={txn.id}>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground">{txn.symbol}</span>
                      <p className="truncate text-xs text-muted-foreground">{txn.company_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={txn.transaction_type === 'buy' ? 'info' : 'brand'} className="capitalize">
                        {txn.transaction_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-foreground">{Number(txn.quantity)}</td>
                    <td className="px-6 py-4 text-foreground">{formatRupees(Number(txn.price))}</td>
                    <td className={cn('px-6 py-4 font-semibold', pnl === null ? 'text-muted-foreground' : pnl >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {pnl !== null ? `${pnl >= 0 ? '+' : ''}${formatRupees(pnl)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-foreground">{txn.business_head_name}</td>
                    <td className="px-6 py-4 text-foreground">{formatDate(txn.transaction_date)}</td>
                  </tr>
                );
              })
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

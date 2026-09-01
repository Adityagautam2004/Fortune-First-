'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { BusinessHeadFilter } from './components/business-head-filter';
import type { FundsTransactionSummary, OrderType, PaginationMeta, StockTransaction } from './types';

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

const ORDER_TYPE_OPTIONS: { value: OrderType | ''; label: string }[] = [
  { value: '', label: 'All Order Types' },
  { value: 'regular', label: 'Regular' },
  { value: 'mtf', label: 'MTF' },
];

// Shared by /board/funds-transactions and /admin/funds-transactions —
// view-only for every role except delete, which is super_admin-only. The
// underlying buy/sell actions themselves live on the portfolio dashboard.
export function FundsTransactionsPage() {
  const { user } = useAuth();
  const canDelete = user?.role === 'super_admin';

  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [summary, setSummary] = useState<FundsTransactionSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [businessHeadId, setBusinessHeadId] = useState('');
  const [type, setType] = useState('');
  const [outcome, setOutcome] = useState('');
  const [orderType, setOrderType] = useState<OrderType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTransactions = () => {
    setLoading(true);
    return api
      .get('/board/funds-transactions', {
        params: {
          page,
          limit: 20,
          businessHeadId: businessHeadId || undefined,
          type: type || undefined,
          outcome: outcome || undefined,
          orderType: orderType || undefined,
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
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, businessHeadId, type, outcome, orderType, dateFrom, dateTo]);

  const resetToPageOne = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction? This only removes the log entry — the position itself is not adjusted.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/funds-transactions/${id}`);
      await fetchTransactions();
    } catch (error) {
      console.error('Failed to delete transaction', error);
      alert('Failed to delete transaction.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Funds Transactions</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Every stock buy and sell recorded by business heads.</p>
      </div>

      {/* Compact summary — a single row of numbers, no icon tiles */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <SummaryStat label="Buys" value={summary ? `${summary.buy_count} · ${formatRupees(summary.total_buy_value)}` : '—'} />
        <SummaryStat label="Sells" value={summary ? `${summary.sell_count} · ${formatRupees(summary.total_sell_value)}` : '—'} />
        <SummaryStat label="Profit" value={summary ? formatRupees(summary.total_profit) : '—'} tone="positive" />
        <SummaryStat label="Loss" value={summary ? formatRupees(Math.abs(summary.total_loss)) : '—'} tone="negative" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
        <select
          value={orderType}
          onChange={(e) => resetToPageOne(setOrderType)(e.target.value as OrderType | '')}
          aria-label="Filter by order type"
          className="rounded-lg border border-brand-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          {ORDER_TYPE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No transactions found.</p>
      ) : (
        <>
          {/* Mobile: one card per transaction */}
          <div className="space-y-2.5 md:hidden">
            {transactions.map((txn) => (
              <TransactionCard key={txn.id} txn={txn} canDelete={canDelete} deleting={deletingId === txn.id} onDelete={handleDelete} />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-brand-border bg-card md:block">
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
                  {canDelete && <th className="whitespace-nowrap px-6 py-3 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((txn) => {
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
                      {canDelete && (
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            disabled={deletingId === txn.id}
                            onClick={() => handleDelete(txn.id)}
                            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-40 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                            title="Delete transaction"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
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

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <div className="rounded-xl border border-brand-border bg-card px-3.5 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-base font-bold',
          tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-red-600' : 'text-foreground'
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TransactionCard({
  txn,
  canDelete,
  deleting,
  onDelete,
}: {
  txn: StockTransaction;
  canDelete: boolean;
  deleting: boolean;
  onDelete: (id: string) => void;
}) {
  const pnl = txn.profit_loss !== null ? Number(txn.profit_loss) : null;

  return (
    <div className="rounded-xl border border-brand-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-foreground">{txn.symbol}</p>
            <Badge variant={txn.transaction_type === 'buy' ? 'info' : 'brand'} className="capitalize">
              {txn.transaction_type}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{txn.company_name}</p>
        </div>
        {canDelete && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => onDelete(txn.id)}
            className="shrink-0 rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-500/15"
            title="Delete transaction"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-foreground">{Number(txn.quantity)} @ {formatRupees(Number(txn.price))}</span>
        <span className={cn('font-semibold', pnl === null ? 'text-muted-foreground' : pnl >= 0 ? 'text-emerald-600' : 'text-red-600')}>
          {pnl !== null ? `${pnl >= 0 ? '+' : ''}${formatRupees(pnl)}` : '—'}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-brand-border pt-2 text-xs text-muted-foreground">
        <span>{txn.business_head_name}</span>
        <span>{formatDate(txn.transaction_date)}</span>
      </div>
    </div>
  );
}

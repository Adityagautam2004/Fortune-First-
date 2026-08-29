'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { BusinessHeadFilter } from './components/business-head-filter';
import { AddStockModal } from './components/add-stock-modal';
import { PositionActionModal } from './components/position-action-modal';
import type { PortfolioSummary, StockPosition } from './types';

function formatRupees(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// Shared by /board/portfolio (investment_head, business_head) and
// /admin/portfolio (super_admin) — identical data for every role, only the
// write controls (Add Stock / Sell / Add More) are gated to business_head.
// Layout follows the compact "current value up top, holdings as cards below"
// pattern of consumer trading apps (Groww etc.) rather than a dashboard-style
// grid of stat tiles — this is meant to be scanned in seconds, not analyzed.
export function PortfolioDashboardPage() {
  const { user } = useAuth();
  const canTrade = user?.role === 'business_head';

  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [businessHeadId, setBusinessHeadId] = useState('');
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activePosition, setActivePosition] = useState<StockPosition | null>(null);

  const fetchPortfolio = useCallback(() => {
    return api
      .get('/board/portfolio', { params: { addedBy: businessHeadId || undefined } })
      .then((res) => {
        setPositions(res.data.data.positions || []);
        setSummary(res.data.data.summary);
      })
      .catch((error) => console.error('Failed to load portfolio', error));
  }, [businessHeadId]);

  useEffect(() => {
    setLoading(true);
    fetchPortfolio().finally(() => setLoading(false));

    // Keep prices "live" without a manual refresh — matches the backend's
    // own 20s quote cache TTL, so this never asks for fresher data than the
    // server can actually give it.
    const interval = setInterval(fetchPortfolio, 20000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const pnlPositive = (summary?.unrealized_pnl ?? 0) >= 0;
  const pnlPct = summary && summary.total_invested > 0 ? (summary.unrealized_pnl / summary.total_invested) * 100 : 0;

  return (
    <div className="space-y-5 pb-20 sm:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Portfolio</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Firm-wide stock positions, live.</p>
        </div>
        {canTrade && (
          <Button onClick={() => setAddModalOpen(true)} className="hidden sm:inline-flex">
            <Plus size={16} /> Add Stock
          </Button>
        )}
      </div>

      {/* Groww-style compact summary: one big current-value number, a
          colored P&L pill, and invested/count as small secondary text —
          not a grid of icon tiles. */}
      <div className="rounded-2xl border border-brand-border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground">Current Value</p>
        <p className="mt-1 text-3xl font-extrabold text-foreground">
          {summary ? formatRupees(summary.current_value) : '—'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {summary && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold',
                pnlPositive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
              )}
            >
              {pnlPositive ? '+' : ''}{formatRupees(summary.unrealized_pnl)} ({pnlPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            Invested {summary ? formatRupees(summary.total_invested) : '—'} · {summary?.position_count ?? 0} stocks
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-foreground">Holdings</h2>
        <BusinessHeadFilter value={businessHeadId} onChange={setBusinessHeadId} className="w-44" />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
      ) : positions.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No open positions.</p>
      ) : (
        <>
          {/* Mobile: one card per stock, everything stacked — no horizontal
              scrolling to see the rest of a row. */}
          <div className="space-y-2.5 md:hidden">
            {positions.map((position) => (
              <PositionCard key={position.id} position={position} canTrade={canTrade} onTap={setActivePosition} />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-brand-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-muted text-foreground">
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Stock</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Qty</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Avg. Price</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Live Price</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Current Value</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">P&amp;L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {positions.map((position) => {
                  const positive = (position.unrealized_pnl ?? 0) >= 0;
                  return (
                    <tr key={position.id}>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          disabled={!canTrade}
                          onClick={() => setActivePosition(position)}
                          className={cn('text-left font-semibold text-foreground', canTrade && 'hover:text-primary hover:underline')}
                        >
                          {position.symbol}
                        </button>
                        <p className="truncate text-xs text-muted-foreground">{position.company_name}</p>
                      </td>
                      <td className="px-6 py-4 text-foreground">{position.quantity}</td>
                      <td className="px-6 py-4 text-foreground">{formatRupees(position.average_price)}</td>
                      <td className="px-6 py-4 text-foreground">
                        {position.current_price !== null ? formatRupees(position.current_price) : '—'}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {position.current_value !== null ? formatRupees(position.current_value) : '—'}
                      </td>
                      <td className={cn('px-6 py-4 font-semibold', position.unrealized_pnl === null ? 'text-muted-foreground' : positive ? 'text-emerald-600' : 'text-red-600')}>
                        {position.unrealized_pnl !== null ? `${positive ? '+' : ''}${formatRupees(position.unrealized_pnl)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Mobile FAB — the inline header button only shows at sm+ */}
      {canTrade && (
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          aria-label="Add Stock"
          className="fixed bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 sm:hidden"
        >
          <Plus size={24} />
        </button>
      )}

      <AddStockModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={fetchPortfolio} />
      <PositionActionModal position={activePosition} onClose={() => setActivePosition(null)} onSuccess={fetchPortfolio} />
    </div>
  );
}

function PositionCard({
  position,
  canTrade,
  onTap,
}: {
  position: StockPosition;
  canTrade: boolean;
  onTap: (position: StockPosition) => void;
}) {
  const positive = (position.unrealized_pnl ?? 0) >= 0;
  const pnlPct = position.current_value !== null && position.invested_amount > 0
    ? ((position.current_value - position.invested_amount) / position.invested_amount) * 100
    : null;

  return (
    <button
      type="button"
      disabled={!canTrade}
      onClick={() => onTap(position)}
      className={cn(
        'w-full rounded-xl border border-brand-border bg-card p-4 text-left transition-colors',
        canTrade && 'active:bg-muted'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-foreground">{position.symbol}</p>
          <p className="truncate text-xs text-muted-foreground">{position.company_name}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold text-foreground">
            {position.current_price !== null ? formatRupees(position.current_price) : '—'}
          </p>
          {pnlPct !== null && (
            <p className={cn('text-xs font-semibold', positive ? 'text-emerald-600' : 'text-red-600')}>
              {positive ? '+' : ''}{pnlPct.toFixed(2)}%
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-2.5 text-xs text-muted-foreground">
        <span>{position.quantity} shares · Avg {formatRupees(position.average_price)}</span>
        <span className={cn('font-semibold', position.unrealized_pnl === null ? 'text-muted-foreground' : positive ? 'text-emerald-600' : 'text-red-600')}>
          {position.unrealized_pnl !== null ? `${positive ? '+' : ''}${formatRupees(position.unrealized_pnl)}` : '—'}
        </span>
      </div>
    </button>
  );
}

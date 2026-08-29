'use client';

import { useCallback, useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Layers, Plus } from 'lucide-react';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { BoardStatTile } from '@/features/board/components/board-stat-tile';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Portfolio Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Firm-wide stock positions with live market prices.
          </p>
        </div>
        {canTrade && (
          <Button onClick={() => setAddModalOpen(true)} className="w-full sm:w-auto">
            <Plus size={16} /> Add Stock
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BoardStatTile icon={Wallet} label="Total Invested" value={summary ? formatRupees(summary.total_invested) : '—'} />
        <BoardStatTile icon={Layers} label="Current Value" value={summary ? formatRupees(summary.current_value) : '—'} />
        <BoardStatTile
          icon={pnlPositive ? TrendingUp : TrendingDown}
          label="Unrealized P&L"
          value={summary ? `${pnlPositive ? '+' : ''}${formatRupees(summary.unrealized_pnl)}` : '—'}
        />
        <BoardStatTile icon={Layers} label="Open Positions" value={summary ? String(summary.position_count) : '—'} />
      </div>

      <div className="flex items-center justify-end">
        <BusinessHeadFilter value={businessHeadId} onChange={setBusinessHeadId} className="w-full sm:w-56" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted text-foreground">
              <th className="whitespace-nowrap px-6 py-3 font-medium">Stock</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Qty</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Avg. Price</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Live Price</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Current Value</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">P&amp;L</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Added By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">Loading...</td></tr>
            ) : positions.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">No open positions.</td></tr>
            ) : (
              positions.map((position) => {
                const positive = (position.unrealized_pnl ?? 0) >= 0;
                return (
                  <tr key={position.id}>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={!canTrade}
                        onClick={() => setActivePosition(position)}
                        className={cn(
                          'text-left font-semibold text-foreground',
                          canTrade && 'hover:text-primary hover:underline'
                        )}
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
                    <td className="px-6 py-4 text-foreground">{position.added_by_name}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AddStockModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={fetchPortfolio} />
      <PositionActionModal position={activePosition} onClose={() => setActivePosition(null)} onSuccess={fetchPortfolio} />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { IndianRupee, TrendingUp, Wallet, ArrowDownLeft } from 'lucide-react';

import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { MonthlyReturn } from '@/types';
import { StatCard } from './components/stat-card';
import { PortfolioGrowthChart } from './components/portfolio-growth-chart';
import { RecentActivityTable } from './components/recent-activity-table';

interface DashboardStats {
  totalInvested: number;
  totalWithdrawn: number;
  totalReturns: number;
  payoutCount: number;
  lastPayout: { amount: number; month: number; year: number; payoutDate: string | null } | null;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatRupees(value: number) {
  return `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function DashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<MonthlyReturn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get('/customer/dashboard'),
      api.get('/customer/investments'),
    ])
      .then(([dashboardRes, historyRes]) => {
        if (cancelled) return;
        setStats(dashboardRes.data.data);
        setHistory(historyRes.data.data || []);
      })
      .catch((error) => console.error('Failed to load dashboard data', error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading your portfolio...</div>;
  }

  const payoutCount = stats?.payoutCount ?? 0;
  const lastPayout = stats?.lastPayout ?? null;
  const lastPayoutFootnote = lastPayout
    ? `For ${MONTH_LABELS[lastPayout.month - 1]} ${lastPayout.year}${lastPayout.payoutDate ? ` · paid ${formatShortDate(lastPayout.payoutDate)}` : ''}`
    : 'No payouts yet';

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between rounded-2xl border border-brand-border bg-card p-3.5">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Welcome Back, {firstName}!</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Track your investments and returns.</p>
        </div>
        <span className="text-sm text-muted-foreground">{today}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          label="Total Investment"
          value={formatRupees(stats?.totalInvested ?? 0)}
          footnote="Active capital, net of withdrawals"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Returns"
          value={formatRupees(stats?.totalReturns ?? 0)}
          footnote={payoutCount === 0 ? 'No payouts yet' : `Across ${payoutCount} payout${payoutCount === 1 ? '' : 's'}`}
        />
        <StatCard
          icon={Wallet}
          label="Last Payout"
          value={lastPayout ? formatRupees(lastPayout.amount) : '—'}
          footnote={lastPayoutFootnote}
        />
        <StatCard
          icon={ArrowDownLeft}
          label="Total Withdrawn"
          value={formatRupees(stats?.totalWithdrawn ?? 0)}
          footnote="Completed withdrawals"
        />
      </div>

      <PortfolioGrowthChart history={history} />

      <RecentActivityTable history={history} />
    </div>
  );
}

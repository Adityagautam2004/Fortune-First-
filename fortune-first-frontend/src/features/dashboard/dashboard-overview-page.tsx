'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Mail, Users } from 'lucide-react';

import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { MonthlyReturn } from '@/types';
import { StatCard } from './components/stat-card';
import { PortfolioGrowthChart } from './components/portfolio-growth-chart';
import { RecentActivityTable } from './components/recent-activity-table';

interface DashboardStats {
  totalInvested: number;
  currentValue: number;
  cagr: number;
  thisMonthReturn: number;
  activePlans: number;
}

function formatRupees(value: number) {
  return `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-brand-border bg-card p-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Welcome Back, {firstName}!</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your investments and returns.</p>
        </div>
        <span className="text-sm text-muted-foreground">{today}</span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Total Investment"
          value={formatRupees(stats?.totalInvested ?? 0)}
          footnote="vs last month"
        />
        <StatCard
          icon={TrendingUp}
          label="Current Value"
          value={formatRupees(stats?.currentValue ?? 0)}
          delta={stats?.cagr ? `+${stats.cagr}%` : undefined}
          footnote="vs last month"
        />
        <StatCard
          icon={Mail}
          label="Monthly Return"
          value={formatRupees(stats?.thisMonthReturn ?? 0)}
          footnote="vs last month"
        />
        <StatCard
          icon={Users}
          label="Active Plans"
          value={stats === null ? '—' : String(stats.activePlans)}
          footnote="Total Active Plans"
        />
      </div>

      <PortfolioGrowthChart history={history} />

      <RecentActivityTable history={history} />
    </div>
  );
}

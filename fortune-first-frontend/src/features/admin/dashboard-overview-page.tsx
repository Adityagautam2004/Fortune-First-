'use client';

import { useEffect, useState } from 'react';
import { Users, IndianRupee, TrendingUp, Headphones, LineChart, BarChart3, Download } from 'lucide-react';

import api from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { AdminStatCard } from './components/admin-stat-card';
import { AdminChartPlaceholder } from './components/admin-chart-placeholder';
import { RecentTransactionsTable } from './components/recent-transactions-table';
import { TopFundsPlaceholder } from './components/top-funds-placeholder';
import { QuickActions } from './components/quick-actions';
import type { AdminDashboardStats, AdminSupportTicket, AdminInvestmentRow } from './types';

function formatCrore(value: number) {
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function DashboardOverviewPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [investments, setInvestments] = useState<AdminInvestmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/support'),
      api.get('/admin/financials'),
    ])
      .then(([dashboardRes, supportRes, financialsRes]) => {
        if (cancelled) return;
        setStats(dashboardRes.data.data);
        setTickets(supportRes.data.data || []);
        setInvestments(financialsRes.data.data?.investments || []);
      })
      .catch((error) => console.error('Failed to load admin dashboard data', error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingTickets = tickets.filter((t) => t.status !== 'Resolved').length;

  const thisMonthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const handleExportData = () => {
    if (investments.length === 0) return;
    downloadCsv(
      'fortune_first_dashboard_export.csv',
      investments.map((row) => ({
        Date: row.investment_date,
        Investor: row.customer_name,
        Email: row.customer_email,
        'Amount (INR)': Number(row.amount),
        Status: row.status,
      }))
    );
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading dashboard overview...</div>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between border-b border-brand-border pb-2.5">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Dashboard Overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Overview of platform performance</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-muted-foreground">{thisMonthLabel}</span>
          <button
            type="button"
            onClick={handleExportData}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <Download size={15} />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <AdminStatCard
          icon={Users}
          label="Total Clients"
          value={(stats?.totalClients ?? 0).toLocaleString('en-IN')}
        />
        <AdminStatCard icon={IndianRupee} label="Total AUM" value={formatCrore(stats?.totalAum ?? 0)} />
        <AdminStatCard
          icon={TrendingUp}
          label="Total Payouts This Month"
          value={formatCrore(stats?.monthlyPayouts ?? 0)}
        />
        <AdminStatCard icon={Headphones} label="Pending Support Tickets" value={String(pendingTickets)} />
      </div>

      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <AdminChartPlaceholder
          icon={LineChart}
          title="AUM Over Time"
          legend="AUM (₹ Crore)"
          message="Historical AUM snapshots aren't tracked in the system yet."
        />
        <AdminChartPlaceholder
          icon={BarChart3}
          title="Returns Over Time (YTD)"
          legend="Returns (₹ Crore)"
          message="Aggregate monthly returns history isn't tracked yet."
        />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactionsTable rows={investments} />
        </div>
        <div className="lg:col-span-1">
          <TopFundsPlaceholder />
        </div>
      </div>

      <QuickActions onExportData={handleExportData} />
    </div>
  );
}

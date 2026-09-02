'use client';

import { useEffect, useState } from 'react';
import { Users, IndianRupee, TrendingUp, Headphones, Download } from 'lucide-react';

import api from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { AdminStatCard } from './components/admin-stat-card';
import { OperatingCapitalChart } from './components/operating-capital-chart';
import { ProfitOverTimeChart } from './components/profit-over-time-chart';
import { RecentTransactionsTable } from './components/recent-transactions-table';
import { QuickActions } from './components/quick-actions';
import type { AdminDashboardStats, AdminSupportTicket, AdminInvestmentRow, AdminTransactionRow } from './types';
import type { MonthlyReport } from '@/features/reports/types';

function formatLakh(value: number) {
  if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function DashboardOverviewPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [investments, setInvestments] = useState<AdminInvestmentRow[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<AdminTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/support'),
      api.get('/admin/financials'),
      api.get('/board/reports', { params: { limit: 60 } }),
      api.get('/admin/transactions', { params: { limit: 5 } }),
    ])
      .then(([dashboardRes, supportRes, financialsRes, reportsRes, transactionsRes]) => {
        if (cancelled) return;
        setStats(dashboardRes.data.data);
        setTickets(supportRes.data.data || []);
        setInvestments(financialsRes.data.data?.investments || []);
        setReports(reportsRes.data.data?.reports || []);
        setRecentTransactions(transactionsRes.data.data?.transactions || []);
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
        <AdminStatCard icon={IndianRupee} label="Total AUM" value={formatLakh(stats?.totalAum ?? 0)} />
        <AdminStatCard
          icon={TrendingUp}
          label="Total Payouts This Month"
          value={formatLakh(stats?.monthlyPayouts ?? 0)}
        />
        <AdminStatCard icon={Headphones} label="Pending Support Tickets" value={String(pendingTickets)} />
      </div>

      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <OperatingCapitalChart reports={reports} />
        <ProfitOverTimeChart reports={reports} />
      </div>

      <RecentTransactionsTable rows={recentTransactions} />

      <QuickActions onExportData={handleExportData} />
    </div>
  );
}

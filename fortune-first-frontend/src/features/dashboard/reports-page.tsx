'use client';

import { useEffect, useMemo, useState } from 'react';
import { IndianRupee, Undo2, FileText, Percent, LayoutPanelLeft, Layers } from 'lucide-react';

import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { MonthlyReturn } from '@/types';
import { ReportSummaryTile } from './components/report-summary-tile';
import { ReportTypeCard } from './components/report-type-card';
import { DownloadReportCard } from './components/download-report-card';

interface DashboardStats {
  totalInvested: number;
  currentValue: number;
  cagr: number;
  thisMonthReturn: number;
}

function formatRupees(value: number) {
  return `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
}

export function ReportsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<MonthlyReturn[]>([]);
  const [activePlans, setActivePlans] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/customer/dashboard'), api.get('/customer/investments')])
      .then(([dashboardRes, historyRes]) => {
        if (cancelled) return;
        setStats(dashboardRes.data.data);
        setHistory(historyRes.data.data || []);
      })
      .catch((error) => console.error('Failed to load report data', error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    api
      .get('/investments', { params: { customer_id: user.id, status: 'active', limit: 1 } })
      .then((res) => {
        if (!cancelled) setActivePlans(res.data.data.pagination.total);
      })
      .catch((error) => console.error('Failed to load active plans count', error));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const totalReturns = useMemo(() => {
    return history
      .filter((record) => {
        if (!record.payout_date) return true;
        const recordDate = record.payout_date.slice(0, 10);
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
        return true;
      })
      .reduce((sum, record) => sum + Number(record.payout_amount || 0), 0);
  }, [history, startDate, endDate]);

  const overallRoi = stats?.totalInvested ? (totalReturns / stats.totalInvested) * 100 : 0;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/customer/report/full', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Fortune_First_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading your reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">View and download your investment reports.</p>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-muted p-5">
        <label className="mb-1.5 block text-sm font-semibold text-gray-700">Date Range</label>
        <div className="flex max-w-md items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-brand-border bg-white px-2.5 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-brand-border bg-white px-2.5 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ReportTypeCard
          icon={LayoutPanelLeft}
          title="Monthly Report"
          description="Get a detailed summary of your investments for the selected month."
          onClick={handleDownloadPdf}
        />
        <ReportTypeCard
          icon={Layers}
          title="Annual Report"
          description="Get a detailed summary of your investments for the selected year."
          onClick={handleDownloadPdf}
        />
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Report Summary</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReportSummaryTile icon={IndianRupee} label="Total Investment" value={formatRupees(stats?.totalInvested ?? 0)} />
          <ReportSummaryTile icon={Undo2} label="Total Returns" value={formatRupees(totalReturns)} />
          <ReportSummaryTile icon={FileText} label="Active Plans" value={activePlans === null ? '—' : String(activePlans)} />
          <ReportSummaryTile icon={Percent} label="Overall ROI" value={`${overallRoi.toFixed(2)}%`} />
        </div>
      </div>

      <DownloadReportCard onDownloadPdf={handleDownloadPdf} downloading={downloading} />
    </div>
  );
}

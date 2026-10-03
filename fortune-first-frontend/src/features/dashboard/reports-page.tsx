'use client';

import { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { IndianRupee, Undo2, CalendarCheck, Percent, LayoutPanelLeft, Layers } from 'lucide-react';

import api from '@/lib/api';
import type { MonthlyReturn } from '@/types';
import { ReportSummaryTile } from './components/report-summary-tile';
import { ReportTypeCard } from './components/report-type-card';
import { DownloadReportCard } from './components/download-report-card';

interface DashboardStats {
  totalInvested: number;
}

type ReportType = 'monthly' | 'annual';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatRupees(value: number) {
  return `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
}

// Indian financial year by its starting year: FY 2025 = April 2025 – March 2026.
function financialYearOf(year: number, month: number) {
  return month >= 4 ? year : year - 1;
}

function fyLabel(fy: number) {
  return `FY ${fy}–${String(fy + 1).slice(-2)}`;
}

function toMonthValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// The report endpoints answer with a PDF blob, so an error body arrives as a Blob too.
async function downloadErrorMessage(error: unknown) {
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const body = JSON.parse(await error.response.data.text());
      if (body?.message) return String(body.message);
    } catch {
      /* not JSON */
    }
  }
  return 'We could not generate your report right now. Please try again in a moment.';
}

export function ReportsPage() {
  const now = new Date();
  const currentMonthValue = toMonthValue(now.getFullYear(), now.getMonth() + 1);
  const currentFy = financialYearOf(now.getFullYear(), now.getMonth() + 1);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<MonthlyReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [monthValue, setMonthValue] = useState(currentMonthValue);
  const [fy, setFy] = useState(currentFy);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/customer/dashboard'), api.get('/customer/investments')])
      .then(([dashboardRes, historyRes]) => {
        if (cancelled) return;
        setStats(dashboardRes.data.data);
        const rows: MonthlyReturn[] = historyRes.data.data || [];
        setHistory(rows);
        // Default the monthly picker to the latest month that has a payout.
        const latestPaid = rows.find((r) => r.payout_status === 'paid');
        if (latestPaid) setMonthValue(toMonthValue(latestPaid.year, latestPaid.month));
      })
      .catch((error) => console.error('Failed to load report data', error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Financial years from the client's first payout up to the current one, newest first.
  const fyOptions = useMemo(() => {
    const earliest = history.reduce(
      (min, r) => Math.min(min, financialYearOf(Number(r.year), Number(r.month))),
      currentFy
    );
    const options: number[] = [];
    for (let y = currentFy; y >= Math.min(earliest, currentFy - 1); y--) options.push(y);
    return options;
  }, [history, currentFy]);

  const [selYear, selMonth] = monthValue.split('-').map(Number);
  const periodLabel =
    reportType === 'monthly'
      ? `${MONTH_NAMES[selMonth - 1]} ${selYear}`
      : `${fyLabel(fy)}${fy === currentFy ? ' (to date)' : ''}`;

  // Summary for the selected period — same rules as the PDF: paid payouts
  // only, grouped by the month they relate to.
  const periodSummary = useMemo(() => {
    const inPeriod = history.filter((r) => {
      if (r.payout_status !== 'paid') return false;
      const year = Number(r.year);
      const month = Number(r.month);
      return reportType === 'monthly' ? year === selYear && month === selMonth : financialYearOf(year, month) === fy;
    });
    const totalReturns = inPeriod.reduce((sum, r) => sum + Number(r.payout_amount || 0), 0);
    const totalBase = inPeriod.reduce((sum, r) => sum + Number(r.invested_amount || 0), 0);
    return {
      totalReturns,
      payoutCount: inPeriod.length,
      avgMonthlyReturn: totalBase > 0 ? (totalReturns / totalBase) * 100 : 0,
    };
  }, [history, reportType, selYear, selMonth, fy]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      const response =
        reportType === 'monthly'
          ? await api.get('/customer/report/monthly', { params: { month: selMonth, year: selYear }, responseType: 'blob' })
          : await api.get('/customer/report/annual', { params: { fy }, responseType: 'blob' });
      const filename =
        reportType === 'monthly'
          ? `Fortune_First_Statement_${MONTH_NAMES[selMonth - 1]}_${selYear}.pdf`
          : `Fortune_First_Statement_FY${fy}-${String(fy + 1).slice(-2)}.pdf`;
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(await downloadErrorMessage(error));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading your reports...</div>;
  }

  const selectClass =
    'w-full rounded-lg border border-brand-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-border bg-card p-6">
        <h1 className="text-2xl font-extrabold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a statement type and period, then download your official report.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ReportTypeCard
          icon={LayoutPanelLeft}
          title="Monthly Report"
          description="Your statement for a single month — payout, capital and account summary."
          selected={reportType === 'monthly'}
          onClick={() => setReportType('monthly')}
        />
        <ReportTypeCard
          icon={Layers}
          title="Annual Report"
          description="Your statement for a financial year (April – March), month by month."
          selected={reportType === 'annual'}
          onClick={() => setReportType('annual')}
        />
      </div>

      <div className="rounded-2xl border border-primary/15 bg-muted p-5">
        {reportType === 'monthly' ? (
          <div className="max-w-xs">
            <label htmlFor="report-month" className="mb-1.5 block text-sm font-semibold text-foreground">
              Statement month
            </label>
            <input
              id="report-month"
              type="month"
              value={monthValue}
              max={currentMonthValue}
              onChange={(e) => e.target.value && setMonthValue(e.target.value)}
              className={selectClass}
            />
          </div>
        ) : (
          <div className="max-w-xs">
            <label htmlFor="report-fy" className="mb-1.5 block text-sm font-semibold text-foreground">
              Financial year
            </label>
            <select id="report-fy" value={fy} onChange={(e) => setFy(Number(e.target.value))} className={selectClass}>
              {fyOptions.map((y) => (
                <option key={y} value={y}>
                  {fyLabel(y)} (Apr {y} – Mar {y + 1}){y === currentFy ? ' · to date' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-brand-border bg-card p-6">
        <h3 className="text-lg font-bold text-foreground">Report Summary</h3>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">{periodLabel}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReportSummaryTile icon={IndianRupee} label="Active Investment (today)" value={formatRupees(stats?.totalInvested ?? 0)} />
          <ReportSummaryTile icon={Undo2} label="Returns in Period" value={formatRupees(periodSummary.totalReturns)} />
          <ReportSummaryTile icon={CalendarCheck} label="Payouts Received" value={String(periodSummary.payoutCount)} />
          <ReportSummaryTile icon={Percent} label="Avg Monthly Return" value={`${periodSummary.avgMonthlyReturn.toFixed(2)}%`} />
        </div>
      </div>

      <DownloadReportCard periodLabel={periodLabel} onDownloadPdf={handleDownloadPdf} downloading={downloading} error={downloadError} />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Download, Pencil, Trash2 } from 'lucide-react';

import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { MonthlyReport } from './types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatRupees(value: number | string) {
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface ReportDetailPageProps {
  reportId: string;
}

// Shared by /board/reports/:id (view only) and /admin/reports/:id (full
// management).
export function ReportDetailPage({ reportId }: ReportDetailPageProps) {
  const { user } = useAuth();
  const canManage = user?.role === 'super_admin';
  const pathname = usePathname();
  const basePath = pathname?.startsWith('/admin') ? '/admin/reports' : '/board/reports';

  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/board/reports/${reportId}`)
      .then((res) => setReport(res.data.data))
      .catch((error) => console.error('Failed to load report', error))
      .finally(() => setLoading(false));
  }, [reportId]);

  const handleDelete = async () => {
    if (!confirm('Delete this monthly report? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/reports/${reportId}`);
      window.location.href = basePath;
    } catch (error) {
      console.error('Failed to delete report', error);
      alert('Failed to delete report.');
    }
  };

  if (loading) return <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>;
  if (!report) return <p className="py-10 text-center text-sm text-muted-foreground">Report not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={basePath} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground">{MONTH_NAMES[report.month - 1]} {report.year}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a href={report.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Download size={15} /> <span className="hidden sm:inline">Download PDF</span>
          </a>
          {canManage && (
            <>
              <Link href={`${basePath}/${reportId}/edit`} className="rounded-lg border border-brand-border p-2.5 text-muted-foreground hover:bg-muted">
                <Pencil size={15} />
              </Link>
              <button onClick={handleDelete} className="rounded-lg border border-brand-border p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15">
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Operating Capital (next month)</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{formatRupees(report.operating_capital_total)}</p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Total Payout</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{formatRupees(report.total_payout)}</p>
        </div>
        <div className="rounded-2xl border border-brand-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Total Profit</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-600">{formatRupees(report.total_profit)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-card p-5">
        <p className="mb-3 text-sm font-bold text-foreground">Report PDF</p>
        <iframe src={report.pdf_url} title="Monthly report PDF" className="h-[75vh] w-full rounded-lg border border-brand-border" />
      </div>
    </div>
  );
}

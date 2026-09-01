'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, FileText, Download, Pencil, Trash2 } from 'lucide-react';

import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { MonthlyReport, PaginationMeta } from './types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatRupees(value: number | string) {
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// Shared by /board/reports (investment_head, business_head — view only) and
// /admin/reports (super_admin — full CRUD). Every non-client role sees the
// exact same list; only the write controls differ.
export function ReportsListPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'super_admin';
  const pathname = usePathname();
  const basePath = pathname?.startsWith('/admin') ? '/admin/reports' : '/board/reports';

  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const availableYears = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  const fetchReports = () => {
    setLoading(true);
    return api
      .get('/board/reports', { params: { page, limit: 12, month: month || undefined, year: year || undefined } })
      .then((res) => {
        setReports(res.data.data.reports || []);
        setPagination(res.data.data.pagination);
      })
      .catch((error) => console.error('Failed to load reports', error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, month, year]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this monthly report? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/reports/${id}`);
      await fetchReports();
    } catch (error) {
      console.error('Failed to delete report', error);
      alert('Failed to delete report.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Reports</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Monthly firm-wide results.</p>
        </div>
        {canManage && (
          <Link
            href={`${basePath}/new`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus size={16} /> Add Report
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={month}
          onChange={(e) => { setMonth(e.target.value); setPage(1); }}
          className="rounded-lg border border-brand-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">All Months</option>
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>{name}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => { setYear(e.target.value); setPage(1); }}
          className="rounded-lg border border-brand-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">All Years</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
      ) : reports.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No reports found.</p>
      ) : (
        <>
          {/* Mobile: one card per report */}
          <div className="space-y-2.5 md:hidden">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                basePath={basePath}
                canManage={canManage}
                deleting={deletingId === report.id}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-brand-border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-muted text-foreground">
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Month</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Operating Capital</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Total Payout</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Total Profit</th>
                  <th className="whitespace-nowrap px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {MONTH_NAMES[report.month - 1]} {report.year}
                    </td>
                    <td className="px-6 py-4 text-foreground">{formatRupees(report.operating_capital_total)}</td>
                    <td className="px-6 py-4 text-foreground">{formatRupees(report.total_payout)}</td>
                    <td className="px-6 py-4 text-emerald-600 font-semibold">{formatRupees(report.total_profit)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <a href={report.pdf_url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary" title="View PDF">
                          <FileText size={15} />
                        </a>
                        <a href={report.pdf_url} target="_blank" rel="noopener noreferrer" download className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary" title="Download PDF">
                          <Download size={15} />
                        </a>
                        {canManage && (
                          <>
                            <Link href={`${basePath}/${report.id}/edit`} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary" title="Edit">
                              <Pencil size={15} />
                            </Link>
                            <button
                              type="button"
                              disabled={deletingId === report.id}
                              onClick={() => handleDelete(report.id)}
                              className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-500/15"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

function ReportCard({
  report,
  basePath,
  canManage,
  deleting,
  onDelete,
}: {
  report: MonthlyReport;
  basePath: string;
  canManage: boolean;
  deleting: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="font-bold text-foreground">{MONTH_NAMES[report.month - 1]} {report.year}</p>
        <span className="text-sm font-semibold text-emerald-600">{formatRupees(report.total_profit)}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs text-muted-foreground">
        <span>Op. Capital: {formatRupees(report.operating_capital_total)}</span>
        <span>Payout: {formatRupees(report.total_payout)}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-brand-border pt-2.5">
        <a href={report.pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-lg border border-brand-border py-1.5 text-center text-xs font-semibold text-foreground">
          View PDF
        </a>
        {canManage && (
          <>
            <Link href={`${basePath}/${report.id}/edit`} className="rounded-lg border border-brand-border p-1.5 text-muted-foreground">
              <Pencil size={15} />
            </Link>
            <button
              type="button"
              disabled={deleting}
              onClick={() => onDelete(report.id)}
              className="rounded-lg border border-brand-border p-1.5 text-red-500 disabled:opacity-40"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

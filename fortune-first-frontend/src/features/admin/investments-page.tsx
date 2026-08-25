'use client';

import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import type { AdminInvestmentRow, PaginationMeta } from './types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  exited: 'bg-muted text-muted-foreground',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function InvestmentsPage() {
  const [investments, setInvestments] = useState<AdminInvestmentRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchInvestments = () => {
    return api
      .get('/admin/investments', { params: { page, limit: 10, status: statusFilter === 'all' ? undefined : statusFilter } })
      .then((res) => {
        setInvestments(res.data.data.investments || []);
        setPagination(res.data.data.pagination);
      })
      .catch((error) => console.error('Failed to load investments', error));
  };

  useEffect(() => {
    setLoading(true);
    fetchInvestments().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleDecision = async (id: string, status: 'active' | 'rejected') => {
    setActioningId(id);
    try {
      await api.patch(`/admin/investments/${id}/status`, { status });
      await fetchInvestments();
    } catch (error) {
      alert(getErrorMessage(error, 'Failed to update investment status'));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Investments submitted by investment heads. Pending ones need your approval before they count as active.
        </p>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-brand-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="exited">Exited</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-border bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted text-foreground">
              <th className="whitespace-nowrap px-6 py-3 font-medium">Client</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Amount</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Date</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Status</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Proof</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">Loading...</td></tr>
            ) : investments.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No investments found.</td></tr>
            ) : (
              investments.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{inv.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{inv.customer_email}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{formatRupees(Number(inv.amount))}</td>
                  <td className="px-6 py-4 text-foreground">{formatDate(inv.investment_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[inv.status] || 'bg-muted text-muted-foreground'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {inv.payment_screenshot_url ? (
                      <a href={inv.payment_screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <ImageIcon size={14} /> View
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {inv.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          disabled={actioningId === inv.id}
                          onClick={() => handleDecision(inv.id, 'active')}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={actioningId === inv.id}
                          onClick={() => handleDecision(inv.id, 'rejected')}
                          className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50 dark:bg-red-500/15 dark:text-red-400"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

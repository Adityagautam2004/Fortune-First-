'use client';

import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Paperclip } from 'lucide-react';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import type { AdminWithdrawalRow, PaginationMeta } from './types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
};

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  // Per-row optional screenshot picked before "Mark Complete" is clicked
  const [pendingFiles, setPendingFiles] = useState<Record<string, File | undefined>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchWithdrawals = () => {
    return api
      .get('/admin/withdrawals', { params: { page, limit: 10, status: statusFilter === 'all' ? undefined : statusFilter } })
      .then((res) => {
        setWithdrawals(res.data.data.withdrawals || []);
        setPagination(res.data.data.pagination);
      })
      .catch((error) => console.error('Failed to load withdrawals', error));
  };

  useEffect(() => {
    setLoading(true);
    fetchWithdrawals().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleDecision = async (id: string, status: 'completed' | 'rejected') => {
    setActioningId(id);
    try {
      const file = pendingFiles[id];
      if (file) {
        const formData = new FormData();
        formData.append('status', status);
        formData.append('screenshot', file);
        await api.patch(`/admin/withdrawals/${id}/status`, formData);
      } else {
        await api.patch(`/admin/withdrawals/${id}/status`, { status });
      }
      setPendingFiles((prev) => ({ ...prev, [id]: undefined }));
      await fetchWithdrawals();
    } catch (error) {
      alert(getErrorMessage(error, 'Failed to update withdrawal status'));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Withdrawal requests submitted by investment heads. Attach a screenshot (optional) before marking one complete.
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
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
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
            ) : withdrawals.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No withdrawals found.</td></tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w.id}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{w.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{w.customer_email}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{formatRupees(Number(w.amount))}</td>
                  <td className="px-6 py-4 text-foreground">{formatDate(w.withdrawal_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[w.status] || 'bg-muted text-muted-foreground'}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {w.payment_screenshot_url ? (
                      <a href={w.payment_screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <ImageIcon size={14} /> View
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {w.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <input
                          ref={(el) => { fileInputRefs.current[w.id] = el; }}
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => setPendingFiles((prev) => ({ ...prev, [w.id]: e.target.files?.[0] }))}
                        />
                        <button
                          type="button"
                          title={pendingFiles[w.id] ? pendingFiles[w.id]!.name : 'Attach a payment screenshot (optional)'}
                          onClick={() => fileInputRefs.current[w.id]?.click()}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border ${pendingFiles[w.id] ? 'border-primary text-primary' : 'border-brand-border text-muted-foreground'} hover:bg-muted`}
                        >
                          <Paperclip size={13} />
                        </button>
                        <button
                          disabled={actioningId === w.id}
                          onClick={() => handleDecision(w.id, 'completed')}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                          Mark Complete
                        </button>
                        <button
                          disabled={actioningId === w.id}
                          onClick={() => handleDecision(w.id, 'rejected')}
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

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, IndianRupee, TrendingUp, CalendarCheck } from 'lucide-react';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface PublicReturnRow {
  id: string;
  month: number;
  year: number;
  return_pct: number;
  notes: string | null;
  created_at: string;
}

interface YearlyPayoutSummary {
  year: number;
  totalPaid: number;
  paidCount: number;
  pendingCount: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();

const emptyForm = (year: number) => ({
  month: new Date().getMonth() + 1,
  year,
  returnPct: 1.75,
  notes: '',
});

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function PublicReturnsManagement() {
  const [year, setYear] = useState(currentYear);
  const [returns, setReturns] = useState<PublicReturnRow[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<YearlyPayoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm(currentYear));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchYearData = async (y: number) => {
    setIsLoading(true);
    try {
      const [returnsRes, payoutRes] = await Promise.all([
        api.get(`/admin/public-returns?year=${y}&limit=12`),
        api.get(`/admin/payouts/yearly-summary?year=${y}`),
      ]);
      setReturns(returnsRes.data.data.returns);
      setPayoutSummary(payoutRes.data.data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load return history'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchYearData(year); }, [year]);

  const hasReturns = returns.length > 0;
  const avgReturn = hasReturns
    ? returns.reduce((sum, r) => sum + Number(r.return_pct), 0) / returns.length
    : 0;
  const best = hasReturns
    ? returns.reduce((max, r) => (Number(r.return_pct) > Number(max.return_pct) ? r : max), returns[0])
    : null;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(year));
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (r: PublicReturnRow) => {
    setEditingId(r.id);
    setForm({ month: r.month, year: r.year, returnPct: r.return_pct, notes: r.notes || '' });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await api.patch(`/admin/public-returns/${editingId}`, {
          returnPct: form.returnPct,
          notes: form.notes || undefined,
        });
      } else {
        await api.post('/admin/public-returns', {
          month: form.month,
          year: form.year,
          returnPct: form.returnPct,
          notes: form.notes || undefined,
        });
      }
      setModalOpen(false);
      fetchYearData(year);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save entry'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this month\'s entry? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/public-returns/${id}`);
      fetchYearData(year);
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete entry'));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          One entry per calendar month. Feeds the &quot;Track Your Growth&quot; chart on the public landing page.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} /> Add Month
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {/* Year navigation */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
          <ChevronLeft size={18} />
        </Button>
        <span className="min-w-[5rem] text-center text-lg font-bold text-foreground">{year}</span>
        <Button variant="ghost" size="icon" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Yearly summary — real payout total (monthly_returns) + public return % (public_returns) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-brand-border bg-card p-4">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <IndianRupee size={14} className="text-primary" /> Total Paid to Customers
          </div>
          <p className="text-2xl font-extrabold text-foreground">
            {payoutSummary ? formatCurrency(payoutSummary.totalPaid) : '—'}
          </p>
          {payoutSummary && (
            <p className="mt-1 text-xs text-muted-foreground">
              {payoutSummary.paidCount} paid{payoutSummary.pendingCount > 0 ? `, ${payoutSummary.pendingCount} pending` : ''}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-brand-border bg-card p-4">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <TrendingUp size={14} className="text-primary" /> Avg Monthly Return
          </div>
          <p className="text-2xl font-extrabold text-foreground">{hasReturns ? `${avgReturn.toFixed(2)}%` : '—'}</p>
          {best && (
            <p className="mt-1 text-xs text-muted-foreground">
              Best: {MONTH_NAMES[best.month - 1]} — {best.return_pct}%
            </p>
          )}
        </div>
        <div className="rounded-xl border border-brand-border bg-card p-4">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CalendarCheck size={14} className="text-primary" /> Months Tracked
          </div>
          <p className="text-2xl font-extrabold text-foreground">{returns.length} / 12</p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-brand-border overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-surface text-foreground">
              <th className="p-4 text-sm font-medium">Month</th>
              <th className="p-4 text-sm font-medium">Return %</th>
              <th className="p-4 text-sm font-medium">Notes</th>
              <th className="p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : returns.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No return history for {year} yet.</td></tr>
            ) : (
              returns.map((r) => (
                <tr key={r.id} className="hover:bg-muted">
                  <td className="p-4 text-sm font-medium text-foreground">{MONTH_NAMES[r.month - 1]} {r.year}</td>
                  <td className="p-4 text-sm">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-50 text-primary dark:bg-orange-500/15">
                      {r.return_pct}%
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{r.notes || '—'}</td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(r)} className="text-muted-foreground hover:text-foreground" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-red-600" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Month' : 'Add Month'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Month</label>
              <select
                disabled={!!editingId}
                className="w-full border border-brand-border rounded-md bg-card p-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
                value={form.month}
                onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Year</label>
              <input
                type="number"
                required
                disabled={!!editingId}
                min={2020}
                max={2100}
                className="w-full border border-brand-border rounded-md bg-card p-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </div>
          </div>
          {editingId && (
            <p className="text-xs text-muted-foreground">Month/year can&apos;t be changed here — delete and recreate to move an entry.</p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Return % (1.5 – 2)</label>
            <input
              type="number"
              required
              step={0.01}
              min={1.5}
              max={2}
              className="w-full border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-primary"
              value={form.returnPct}
              onChange={(e) => setForm({ ...form, returnPct: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Notes (optional)</label>
            <textarea
              rows={2}
              maxLength={500}
              className="w-full border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-primary"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

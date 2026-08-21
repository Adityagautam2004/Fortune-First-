'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';

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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const emptyForm = () => ({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  returnPct: 1.75,
  notes: '',
});

export function PublicReturnsManagement() {
  const [returns, setReturns] = useState<PublicReturnRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/public-returns?limit=100');
      setReturns(res.data.data.returns);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load return history'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReturns(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
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
      fetchReturns();
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
      fetchReturns();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete entry'));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          One entry per calendar month. Feeds the &quot;Track Your Growth&quot; chart on the public landing page.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} /> Add Month
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-surface text-brand-navy">
              <th className="p-4 text-sm font-medium">Month</th>
              <th className="p-4 text-sm font-medium">Return %</th>
              <th className="p-4 text-sm font-medium">Notes</th>
              <th className="p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : returns.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400">No return history yet.</td></tr>
            ) : (
              returns.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm font-medium text-gray-900">{MONTH_NAMES[r.month - 1]} {r.year}</td>
                  <td className="p-4 text-sm">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-50 text-primary">
                      {r.return_pct}%
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{r.notes || '—'}</td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(r)} className="text-gray-500 hover:text-brand-navy" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="text-gray-500 hover:text-red-600" title="Delete">
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Month</label>
              <select
                disabled={!!editingId}
                className="w-full border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-primary disabled:bg-gray-100 disabled:text-gray-400"
                value={form.month}
                onChange={(e) => setForm({ ...form, month: Number(e.target.value) })}
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Year</label>
              <input
                type="number"
                required
                disabled={!!editingId}
                min={2020}
                max={2100}
                className="w-full border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-primary disabled:bg-gray-100 disabled:text-gray-400"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </div>
          </div>
          {editingId && (
            <p className="text-xs text-gray-400">Month/year can&apos;t be changed here — delete and recreate to move an entry.</p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Return % (1.5 – 2)</label>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes (optional)</label>
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

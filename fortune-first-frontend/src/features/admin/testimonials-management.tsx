'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Star, Pencil, Trash2, Plus } from 'lucide-react';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface Testimonial {
  id: string;
  client_name: string;
  city: string | null;
  content: string;
  rating: number;
  is_visible: boolean;
  created_at: string;
}

const EMPTY_FORM = { clientName: '', city: '', content: '', rating: 5, isVisible: true };

export function TestimonialsManagement() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/testimonials?limit=100');
      setTestimonials(res.data.data.testimonials);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load testimonials'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTestimonials(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setForm({ clientName: t.client_name, city: t.city || '', content: t.content, rating: t.rating, isVisible: t.is_visible });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        clientName: form.clientName,
        city: form.city || undefined,
        content: form.content,
        rating: form.rating,
        isVisible: form.isVisible,
      };
      if (editingId) {
        await api.patch(`/admin/testimonials/${editingId}`, body);
      } else {
        await api.post('/admin/testimonials', body);
      }
      setModalOpen(false);
      fetchTestimonials();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save testimonial'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/testimonials/${id}`);
      fetchTestimonials();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to delete testimonial'));
    }
  };

  const toggleVisible = async (t: Testimonial) => {
    try {
      await api.patch(`/admin/testimonials/${t.id}`, { isVisible: !t.is_visible });
      fetchTestimonials();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update visibility'));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Visible testimonials appear on the public landing page, newest first.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} /> Add Testimonial
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-surface text-brand-navy">
              <th className="p-4 text-sm font-medium">Client</th>
              <th className="p-4 text-sm font-medium">Content</th>
              <th className="p-4 text-sm font-medium">Rating</th>
              <th className="p-4 text-sm font-medium">Visible</th>
              <th className="p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : testimonials.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">No testimonials yet.</td></tr>
            ) : (
              testimonials.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm font-medium text-gray-900">
                    {t.client_name}
                    {t.city && <span className="block text-xs font-normal text-gray-400">{t.city}</span>}
                  </td>
                  <td className="p-4 text-sm text-gray-600 max-w-sm">
                    <span className="line-clamp-2">{t.content}</span>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} size={14} className="fill-primary text-primary" />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <button
                      onClick={() => toggleVisible(t)}
                      className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                        t.is_visible ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t.is_visible ? 'Visible' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(t)} className="text-gray-500 hover:text-brand-navy" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="text-gray-500 hover:text-red-600" title="Delete">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Testimonial' : 'Add Testimonial'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Client Name</label>
            <input
              required
              maxLength={100}
              className="w-full border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-primary"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">City (optional)</label>
            <input
              maxLength={100}
              className="w-full border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-primary"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Content</label>
            <textarea
              required
              rows={3}
              className="w-full border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-primary"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Rating</label>
            <select
              className="w-full border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-primary"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
            />
            Visible on public landing page
          </label>

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

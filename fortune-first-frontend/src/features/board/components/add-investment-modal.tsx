'use client';

import { useState } from 'react';

import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess: () => void;
}

const WEEK_OPTIONS = [1, 2, 3, 4];
const NOTES_MAX = 250;

export function AddInvestmentModal({ isOpen, onClose, customerId, onSuccess }: AddInvestmentModalProps) {
  const [amount, setAmount] = useState(5000);
  const [investmentDate, setInvestmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [weekOfMonth, setWeekOfMonth] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/board/investments', {
        customerId,
        amount,
        investmentDate,
        weekOfMonth,
        notes,
      });
      onSuccess();
      onClose();
      setAmount(5000);
      setNotes('');
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to record investment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Investment" size="md">
      <p className="-mt-4 mb-5 text-sm text-gray-500">Enter investment details</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-800">Amount (₹, multiple of 5,000)</label>
          <input
            type="number"
            min={5000}
            step={5000}
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Investment Date</label>
            <input
              type="date"
              required
              value={investmentDate}
              onChange={(e) => setInvestmentDate(e.target.value)}
              className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">Week of Month</label>
            <select
              value={weekOfMonth}
              onChange={(e) => setWeekOfMonth(Number(e.target.value))}
              className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {WEEK_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-800">Description (Optional)</label>
          <textarea
            value={notes}
            maxLength={NOTES_MAX}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter description (optional)"
            rows={4}
            className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {notes.length}/{NOTES_MAX}
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Save Investment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

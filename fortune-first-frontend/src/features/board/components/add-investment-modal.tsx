'use client';

import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
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
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setAmount(5000);
    setNotes('');
    setScreenshot(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!amount || amount < 5000) {
      setError('Amount must be at least ₹5,000.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('customerId', customerId);
      formData.append('amount', String(amount));
      formData.append('investmentDate', investmentDate);
      formData.append('weekOfMonth', String(weekOfMonth));
      formData.append('notes', notes);
      if (screenshot) formData.append('screenshot', screenshot);

      await api.post('/board/investments', formData);
      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to record investment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Investment" size="md">
      <p className="-mt-4 mb-5 text-sm text-muted-foreground">
        Enter investment details. This will be submitted for admin approval before it goes active.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">Amount (₹, multiple of 5,000)</label>
          <CurrencyInput
            allowDecimals={false}
            required
            value={amount}
            onChange={(v) => setAmount(v === '' ? 0 : v)}
            className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Investment Date</label>
            <input
              type="date"
              required
              value={investmentDate}
              onChange={(e) => setInvestmentDate(e.target.value)}
              className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Week of Month</label>
            <select
              value={weekOfMonth}
              onChange={(e) => setWeekOfMonth(Number(e.target.value))}
              className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          <label className="mb-1 block text-sm font-semibold text-foreground">Description (Optional)</label>
          <textarea
            value={notes}
            maxLength={NOTES_MAX}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter description (optional)"
            rows={4}
            className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {notes.length}/{NOTES_MAX}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-foreground">Payment Screenshot (Optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            className="hidden"
            id="investment-screenshot-input"
          />
          <label
            htmlFor="investment-screenshot-input"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
          >
            <UploadCloud size={16} />
            {screenshot ? screenshot.name : 'Attach a screenshot as proof of payment'}
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Submit for Approval
          </Button>
        </div>
      </form>
    </Modal>
  );
}

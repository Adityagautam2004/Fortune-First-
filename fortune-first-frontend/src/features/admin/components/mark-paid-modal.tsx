'use client';

import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmailConfirmationCheckbox } from '@/components/shared/email-confirmation-checkbox';

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

// Built from local Y/M/D components (not toISOString(), which converts to UTC and can
// roll the date back a day for timezones ahead of UTC).
function toLocalIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface MarkPaidModalProps {
  isOpen: boolean;
  clientName: string;
  payoutAmount: number;
  month: number;
  year: number;
  submitting: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (screenshot: File | null, payoutDate: string, sendEmail: boolean) => void;
}

// Confirmation step before marking a payout paid — the payment screenshot is
// proof-of-payout, offered here but never required to proceed. The payout
// date defaults to today and can be back-dated to when it was actually paid.
export function MarkPaidModal({
  isOpen,
  clientName,
  payoutAmount,
  month,
  year,
  submitting,
  error,
  onClose,
  onConfirm,
}: MarkPaidModalProps) {
  const today = toLocalIso(new Date());
  const periodStart = month && year ? `${year}-${String(month).padStart(2, '0')}-01` : undefined;

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [payoutDate, setPayoutDate] = useState(today);
  const [dateError, setDateError] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setScreenshot(null);
    setPayoutDate(today);
    setDateError('');
    setSendEmail(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleConfirm = () => {
    if (!payoutDate) {
      setDateError('Please select the payout date.');
      return;
    }
    if (payoutDate > today) {
      setDateError('Payout date cannot be in the future.');
      return;
    }
    if (periodStart && payoutDate < periodStart) {
      setDateError('Payout date cannot be before the start of the payout month.');
      return;
    }
    setDateError('');
    onConfirm(screenshot, payoutDate, sendEmail);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Confirm Payout" size="sm">
      <div className="space-y-4">
        <div className="rounded-xl border border-brand-border bg-muted p-4">
          <p className="text-sm text-muted-foreground">Client</p>
          <p className="font-semibold text-foreground">{clientName}</p>
          <p className="mt-2 text-sm text-muted-foreground">Payout Amount</p>
          <p className="font-semibold text-foreground">{formatRupees(payoutAmount)}</p>
        </div>

        <div>
          <label htmlFor="payout-date-input" className="mb-1.5 block text-sm font-semibold text-foreground">
            Payout Date
          </label>
          <input
            id="payout-date-input"
            type="date"
            required
            value={payoutDate}
            min={periodStart}
            max={today}
            onChange={(e) => setPayoutDate(e.target.value)}
            className="w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">The date the payout was made. You can pick a past date.</p>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-foreground">Payment Screenshot (optional)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            className="hidden"
            id="payout-screenshot-input"
          />
          <label
            htmlFor="payout-screenshot-input"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-muted"
          >
            <UploadCloud size={16} />
            {screenshot ? screenshot.name : 'Attach a screenshot as proof (optional)'}
          </label>
          <p className="mt-1.5 text-xs text-muted-foreground">
            You can mark this payout as paid with or without a screenshot.
          </p>
        </div>

        <EmailConfirmationCheckbox
          checked={sendEmail}
          onChange={setSendEmail}
          disabled={submitting}
          description="Emails the customer a payout confirmation. Leave unticked when recording an old payout."
        />

        {(dateError || error) && <p className="text-sm text-red-600">{dateError || error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} isLoading={submitting}>
            Confirm Payout
          </Button>
        </div>
      </div>
    </Modal>
  );
}

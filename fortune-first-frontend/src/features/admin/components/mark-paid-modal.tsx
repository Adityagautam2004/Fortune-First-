'use client';

import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface MarkPaidModalProps {
  isOpen: boolean;
  clientName: string;
  payoutAmount: number;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (screenshot: File | null) => void;
}

// Confirmation step before marking a payout paid — the payment screenshot is
// proof-of-payout, offered here but never required to proceed.
export function MarkPaidModal({ isOpen, clientName, payoutAmount, submitting, onClose, onConfirm }: MarkPaidModalProps) {
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setScreenshot(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(screenshot);
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

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { EmailConfirmationCheckbox } from '@/components/shared/email-confirmation-checkbox';
import { calculatePayout } from '@/features/admin/lib/calculate-payout';
import type { ClientInvestment, ClientPayout, ClientWithdrawal } from '../types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_RETURN_PCT = 2.0;

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

interface Period {
  month: number;
  year: number;
}

const periodKey = (p: Period) => `${p.year}-${p.month}`;

interface RecordPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  investments: ClientInvestment[];
  withdrawals: ClientWithdrawal[];
  payouts: ClientPayout[];
  onSuccess: () => void;
}

// Per-client payout from the Client Detail page — the same POST /board/payouts
// the Process Payouts screen uses, but the investment head picks the payout
// month (current or any past month without a payout yet) and the date it was
// actually paid. The preview mirrors the server's calculation: active
// investments made on or before the end of the selected month, prorated on
// the earliest one's week in its first month.
export function RecordPayoutModal({ isOpen, onClose, customerId, investments, withdrawals, payouts, onSuccess }: RecordPayoutModalProps) {
  const today = toLocalIso(new Date());

  const activeInvestments = useMemo(
    () =>
      investments
        .filter((inv) => inv.status === 'active')
        .sort((a, b) => new Date(a.investment_date).getTime() - new Date(b.investment_date).getTime()),
    [investments]
  );

  // Every month from the earliest active investment up to the current month
  // that doesn't already have a payout row (any status — the backend allows
  // one per client per month), newest first.
  const availablePeriods = useMemo<Period[]>(() => {
    if (activeInvestments.length === 0) return [];
    const taken = new Set(payouts.map((p) => periodKey({ month: Number(p.month), year: Number(p.year) })));
    const start = new Date(activeInvestments[0].investment_date);
    const now = new Date();
    const periods: Period[] = [];
    for (
      let cursor = new Date(now.getFullYear(), now.getMonth(), 1);
      cursor >= new Date(start.getFullYear(), start.getMonth(), 1);
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
    ) {
      const period = { month: cursor.getMonth() + 1, year: cursor.getFullYear() };
      if (!taken.has(periodKey(period))) periods.push(period);
    }
    return periods;
  }, [activeInvestments, payouts]);

  const [selectedKey, setSelectedKey] = useState(() => (availablePeriods[0] ? periodKey(availablePeriods[0]) : ''));
  const [returnPct, setReturnPct] = useState(DEFAULT_RETURN_PCT);
  const [payoutDate, setPayoutDate] = useState(today);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [sendEmail, setSendEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill with the platform's default return rate (read-only for the board).
  useEffect(() => {
    let cancelled = false;
    api
      .get('/board/return-rate')
      .then((res) => {
        const pct = Number(res.data.data?.global_return_pct);
        if (!cancelled && Number.isFinite(pct)) setReturnPct(pct);
      })
      .catch((err) => console.error('Failed to load default return rate', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = availablePeriods.find((p) => periodKey(p) === selectedKey) ?? null;
  const periodStart = selected ? `${selected.year}-${String(selected.month).padStart(2, '0')}-01` : undefined;

  const preview = useMemo(() => {
    if (!selected) return null;
    const periodEnd = new Date(selected.year, selected.month, 1); // first day of the following month
    const eligible = activeInvestments.filter((inv) => new Date(inv.investment_date) < periodEnd);
    if (eligible.length === 0) return null;
    // Mirrors the server: payouts are paid on the ACTIVE investment —
    // invested minus completed withdrawals, both as of the end of the month.
    const totalInvested = eligible.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const totalWithdrawn = withdrawals
      .filter((w) => w.status === 'completed' && new Date(w.withdrawal_date) < periodEnd)
      .reduce((sum, w) => sum + Number(w.amount), 0);
    const investedAmount = Math.round((totalInvested - totalWithdrawn) * 100) / 100;
    if (investedAmount <= 0) return null;
    const earliest = eligible[0];
    const earliestDate = new Date(earliest.investment_date);
    const isFirstMonth = earliestDate.getMonth() + 1 === selected.month && earliestDate.getFullYear() === selected.year;
    const payoutAmount = calculatePayout(
      investedAmount,
      Number.isFinite(returnPct) ? returnPct : 0,
      earliest.week_of_month,
      null,
      isFirstMonth
    );
    return { totalInvested, totalWithdrawn, investedAmount, payoutAmount, isFirstMonth, week: earliest.week_of_month };
  }, [selected, activeInvestments, withdrawals, returnPct]);

  const handlePeriodChange = (key: string) => {
    setSelectedKey(key);
    const period = availablePeriods.find((p) => periodKey(p) === key);
    if (period) {
      const start = `${period.year}-${String(period.month).padStart(2, '0')}-01`;
      if (payoutDate < start) setPayoutDate(today);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selected) {
      setError('Please select the payout month.');
      return;
    }
    if (!preview) {
      setError('This client has no active investment (after withdrawals) for the selected month.');
      return;
    }
    if (!Number.isFinite(returnPct) || returnPct < 0 || returnPct > 100) {
      setError('Return % must be between 0 and 100.');
      return;
    }
    if (!payoutDate || payoutDate > today) {
      setError('Payout date cannot be in the future.');
      return;
    }
    if (periodStart && payoutDate < periodStart) {
      setError('Payout date cannot be before the start of the payout month.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('customerId', customerId);
      formData.append('month', String(selected.month));
      formData.append('year', String(selected.year));
      formData.append('returnPct', String(returnPct));
      formData.append('payoutDate', payoutDate);
      formData.append('sendEmail', String(sendEmail));
      if (screenshot) formData.append('screenshot', screenshot);

      await api.post('/board/payouts', formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to process payout.'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Make Payout" size="md">
      <p className="-mt-4 mb-5 text-sm text-muted-foreground">
        Record a payout for this client. Choose the payout month and the date it was paid. The date can be in the past.
      </p>

      {availablePeriods.length === 0 ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-brand-border bg-muted p-4 text-sm text-foreground">
            {activeInvestments.length === 0
              ? 'This client has no active investments, so there is nothing to pay out.'
              : 'Payouts have already been recorded for every month up to the current one.'}
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="payout-period" className="mb-1 block text-sm font-semibold text-foreground">
                Payout Month
              </label>
              <select
                id="payout-period"
                value={selectedKey}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className={inputClass}
              >
                {availablePeriods.map((p) => (
                  <option key={periodKey(p)} value={periodKey(p)}>
                    {MONTH_LABELS[p.month - 1]} {p.year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="payout-return-pct" className="mb-1 block text-sm font-semibold text-foreground">
                Return (%)
              </label>
              <input
                id="payout-return-pct"
                type="number"
                required
                step={0.1}
                min={0}
                max={100}
                value={Number.isFinite(returnPct) ? returnPct : ''}
                onChange={(e) => setReturnPct(e.target.value === '' ? NaN : Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="payout-date" className="mb-1 block text-sm font-semibold text-foreground">
              Payout Date
            </label>
            <input
              id="payout-date"
              type="date"
              required
              value={payoutDate}
              min={periodStart}
              max={today}
              onChange={(e) => setPayoutDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="rounded-xl border border-brand-border bg-muted p-4 text-sm">
            {preview ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Total Invested</span>
                  <span className="text-foreground">{formatRupees(preview.totalInvested)}</span>
                </div>
                {preview.totalWithdrawn > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Less: Withdrawn</span>
                    <span className="text-foreground">− {formatRupees(preview.totalWithdrawn)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 border-t border-brand-border pt-1.5">
                  <span className="text-muted-foreground">Active Investment (payout base)</span>
                  <span className="font-medium text-foreground">{formatRupees(preview.investedAmount)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Payout Amount (auto calculated)</span>
                  <span className="font-semibold text-foreground">{formatRupees(preview.payoutAmount)}</span>
                </div>
                {preview.isFirstMonth && preview.week > 1 && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    First month, invested in week {preview.week}, so a prorated return applies.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No active investment (after withdrawals) for the selected month.</p>
            )}
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-foreground">Payment Screenshot (Optional)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
              className="hidden"
              id="client-payout-screenshot-input"
            />
            <label
              htmlFor="client-payout-screenshot-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <UploadCloud size={16} />
              {screenshot ? screenshot.name : 'Attach a screenshot as proof of payout'}
            </label>
          </div>

          <EmailConfirmationCheckbox
            checked={sendEmail}
            onChange={setSendEmail}
            description="Emails the customer a payout confirmation. Leave unticked when recording an old payout."
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} disabled={!preview}>
              Confirm Payout
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

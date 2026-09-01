'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Pencil, Plus, Trash2, UploadCloud } from 'lucide-react';

import api from '@/lib/api';
import { cn, getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { InvestmentPatternItem, MonthlyReport, PartnerPayout, PayoutStatus, ReportMember } from './types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EMPTY_MEMBER: ReportMember = {
  name: '', personalAum: 0, profitLossAmount: 0, rdCost: 0, investmentReceived: 0,
  withdrawalAmount: 0, clientMoney: 0, payoutPercentage: 0, payoutAmount: 0,
};

function n(setter: (v: number) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value === '' ? 0 : Number(e.target.value));
}

function formatRupees(value: number) {
  return `₹${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

interface ReportFormPageProps {
  reportId?: string; // present when editing
}

// Shared create/edit form for /admin/reports/new and /admin/reports/:id/edit
// — the only place this section's data actually gets written.
export function ReportFormPage({ reportId }: ReportFormPageProps) {
  const router = useRouter();
  const isEdit = !!reportId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [totalAumNextMonth, setTotalAumNextMonth] = useState(0);
  const [navPrevious, setNavPrevious] = useState(0);
  const [navUpdated, setNavUpdated] = useState(0);
  const [overallProfitPercentage, setOverallProfitPercentage] = useState(0);
  const [overallProfitAmount, setOverallProfitAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const [members, setMembers] = useState<ReportMember[]>([]);
  const [investmentPattern, setInvestmentPattern] = useState<InvestmentPatternItem[]>([]);
  const [editingPatternIndex, setEditingPatternIndex] = useState<number | null>(null);
  const [partnerPayouts, setPartnerPayouts] = useState<PartnerPayout[]>([]);

  // Not entered anywhere — always SUM(members[].personalAum), same formula
  // the backend applies. Shown live so the admin can see it settle as they
  // fill in the breakdown below, instead of typing it in twice.
  const computedOperatingCapital = members.reduce((sum, m) => sum + (Number(m.personalAum) || 0), 0);
  const suggestedNav = navPrevious * (1 + (overallProfitPercentage || 0) / 100);

  useEffect(() => {
    if (isEdit) {
      api.get(`/board/reports/${reportId}`).then((res) => {
        const r: MonthlyReport = res.data.data;
        setMonth(r.month);
        setYear(r.year);
        setTotalAumNextMonth(Number(r.total_aum_next_month));
        setNavPrevious(Number(r.nav_previous));
        setNavUpdated(Number(r.nav_updated));
        setOverallProfitPercentage(Number(r.overall_profit_percentage));
        setOverallProfitAmount(Number(r.overall_profit_amount));
        setNotes(r.notes || '');
        setMembers(r.members);
        setInvestmentPattern(r.investment_pattern);
        setPartnerPayouts(r.partner_payouts);
        setExistingPdfUrl(r.pdf_url);
      }).catch((err) => setError(getErrorMessage(err, 'Failed to load report.')))
        .finally(() => setLoading(false));
    } else {
      // New report — roll forward last month's investment pattern/members
      // (all editable on demand, nothing locked) and suggest this month's
      // opening NAV from last month's closing NAV.
      api.get('/admin/reports/prefill').then((res) => {
        const p = res.data.data;
        if (p.navPrevious) setNavPrevious(p.navPrevious);
        if (p.investmentPattern?.length) setInvestmentPattern(p.investmentPattern);
        if (p.members?.length) setMembers(p.members.map((m: ReportMember) => ({ ...m, profitLossAmount: 0, rdCost: 0, investmentReceived: 0, withdrawalAmount: 0, payoutAmount: 0 })));
      }).catch((err) => console.error('Failed to load prefill', err));
    }
  }, [isEdit, reportId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEdit && !pdfFile) {
      setError('Please attach the original monthly report PDF.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('month', String(month));
      formData.append('year', String(year));
      formData.append('totalAumNextMonth', String(totalAumNextMonth));
      formData.append('navPrevious', String(navPrevious));
      formData.append('navUpdated', String(navUpdated));
      formData.append('overallProfitPercentage', String(overallProfitPercentage));
      formData.append('overallProfitAmount', String(overallProfitAmount));
      formData.append('notes', notes);
      formData.append('members', JSON.stringify(members.filter((m) => m.name.trim())));
      formData.append('investmentPattern', JSON.stringify(investmentPattern.filter((m) => m.name.trim())));
      formData.append('partnerPayouts', JSON.stringify(partnerPayouts.filter((p) => p.name.trim())));
      if (pdfFile) formData.append('pdf', pdfFile);

      if (isEdit) {
        await api.patch(`/admin/reports/${reportId}`, formData);
      } else {
        await api.post('/admin/reports', formData);
      }
      router.push('/admin/reports');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save report.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{isEdit ? 'Edit Report' : 'Add Report'}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Monthly firm-wide result and record.</p>
      </div>

      <Card title="Report Period">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Month">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputClass}>
              {MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
            </select>
          </Field>
          <Field label="Year">
            <input type="number" value={year || ''} onChange={n(setYear)} className={inputClass} />
          </Field>
          <Field label="Total AUM (₹)">
            <input type="number" step="any" value={totalAumNextMonth || ''} onChange={n(setTotalAumNextMonth)} className={inputClass} />
          </Field>
          <Field label="Operating Capital (auto)">
            <div className={cn(inputClass, 'flex items-center bg-muted text-muted-foreground')}>
              {formatRupees(computedOperatingCapital)}
            </div>
          </Field>
        </div>
      </Card>

      <Card title="NAV & Overall Profit">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Previous NAV">
            <input type="number" step="any" value={navPrevious || ''} onChange={n(setNavPrevious)} className={inputClass} />
          </Field>
          <Field label={`Updated NAV${suggestedNav ? ` (suggested ${suggestedNav.toFixed(2)})` : ''}`}>
            <input type="number" step="any" value={navUpdated || ''} onChange={n(setNavUpdated)} className={inputClass} />
          </Field>
          <Field label="Overall Profit %">
            <input type="number" step="any" value={overallProfitPercentage || ''} onChange={n(setOverallProfitPercentage)} className={inputClass} />
          </Field>
          <Field label="Overall Profit Amount (₹)">
            <input type="number" step="any" value={overallProfitAmount || ''} onChange={n(setOverallProfitAmount)} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card title="Investment Head Breakdown" subtitle="Personal AUM, P&L, and every other per-head figure for this month">
        <div className="space-y-3">
          {members.map((m, i) => (
            <div key={i} className="rounded-xl border border-brand-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <input
                  placeholder="Name"
                  value={m.name}
                  onChange={(e) => setMembers((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                  className={cn(inputClass, 'font-semibold')}
                />
                <button type="button" onClick={() => setMembers((prev) => prev.filter((_, idx) => idx !== i))} className="ml-2 shrink-0 rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <MiniField label="Personal AUM">
                  <input type="number" step="any" value={m.personalAum || ''} onChange={(e) => setMembers((prev) => prev.map((x, idx) => idx === i ? { ...x, personalAum: e.target.value === '' ? 0 : Number(e.target.value) } : x))} className={inputClass} />
                </MiniField>
                <MiniField label="Profit/Loss">
                  <input type="number" step="any" value={m.profitLossAmount || ''} onChange={(e) => setMembers((prev) => prev.map((x, idx) => idx === i ? { ...x, profitLossAmount: e.target.value === '' ? 0 : Number(e.target.value) } : x))} className={inputClass} />
                </MiniField>
                <MiniField label="R&D Cost">
                  <input type="number" step="any" value={m.rdCost || ''} onChange={(e) => setMembers((prev) => prev.map((x, idx) => idx === i ? { ...x, rdCost: e.target.value === '' ? 0 : Number(e.target.value) } : x))} className={inputClass} />
                </MiniField>
                <MiniField label="Investment Recv.">
                  <input type="number" step="any" value={m.investmentReceived || ''} onChange={(e) => setMembers((prev) => prev.map((x, idx) => idx === i ? { ...x, investmentReceived: e.target.value === '' ? 0 : Number(e.target.value) } : x))} className={inputClass} />
                </MiniField>
                <MiniField label="Withdrawal">
                  <input type="number" step="any" value={m.withdrawalAmount || ''} onChange={(e) => setMembers((prev) => prev.map((x, idx) => idx === i ? { ...x, withdrawalAmount: e.target.value === '' ? 0 : Number(e.target.value) } : x))} className={inputClass} />
                </MiniField>
                <MiniField label="Client Money">
                  <input type="number" step="any" value={m.clientMoney || ''} onChange={(e) => setMembers((prev) => prev.map((x, idx) => idx === i ? { ...x, clientMoney: e.target.value === '' ? 0 : Number(e.target.value) } : x))} className={inputClass} />
                </MiniField>
                <MiniField label="Payout %">
                  <input type="number" step="any" value={m.payoutPercentage || ''} onChange={(e) => setMembers((prev) => prev.map((x, idx) => idx === i ? { ...x, payoutPercentage: e.target.value === '' ? 0 : Number(e.target.value) } : x))} className={inputClass} />
                </MiniField>
                <MiniField label="Payout Amount">
                  <input type="number" step="any" value={m.payoutAmount || ''} onChange={(e) => setMembers((prev) => prev.map((x, idx) => idx === i ? { ...x, payoutAmount: e.target.value === '' ? 0 : Number(e.target.value) } : x))} className={inputClass} />
                </MiniField>
              </div>
            </div>
          ))}
          <AddRowButton label="Add Investment Head" onClick={() => setMembers((prev) => [...prev, { ...EMPTY_MEMBER }])} />
        </div>
      </Card>

      <Card title="Updated Investment Pattern" subtitle="Each board member's personal stake — rolled forward from last month; click a value to change it">
        <div className="space-y-2">
          {investmentPattern.map((item, i) => {
            const editing = editingPatternIndex === i;
            return (
              <div key={i} className="flex items-center gap-2.5 rounded-lg border border-brand-border px-3 py-2">
                {editing ? (
                  <>
                    <input
                      placeholder="Name"
                      value={item.name}
                      onChange={(e) => setInvestmentPattern((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                      className={cn(inputClass, 'flex-1')}
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Amount (₹)"
                      value={item.amount || ''}
                      onChange={(e) => setInvestmentPattern((prev) => prev.map((x, idx) => idx === i ? { ...x, amount: e.target.value === '' ? 0 : Number(e.target.value) } : x))}
                      className={cn(inputClass, 'w-36')}
                      autoFocus
                    />
                    <button type="button" onClick={() => setEditingPatternIndex(null)} className="shrink-0 rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/15">
                      <Check size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {item.name || <span className="italic text-muted-foreground">Unnamed</span>}
                    </span>
                    <span className="text-sm text-muted-foreground">{formatRupees(item.amount)}</span>
                    <button type="button" onClick={() => setEditingPatternIndex(i)} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted">
                      <Pencil size={14} />
                    </button>
                  </>
                )}
                <RemoveRowButton onClick={() => {
                  setInvestmentPattern((prev) => prev.filter((_, idx) => idx !== i));
                  if (editingPatternIndex === i) setEditingPatternIndex(null);
                }} />
              </div>
            );
          })}
          <AddRowButton
            label="Add Member"
            onClick={() => {
              setInvestmentPattern((prev) => [...prev, { name: '', amount: 0 }]);
              setEditingPatternIndex(investmentPattern.length);
            }}
          />
        </div>
      </Card>

      <Card title="Partner Payouts" subtitle="Non-client payouts, e.g. a fixed % to a silent partner">
        <div className="space-y-2.5">
          {partnerPayouts.map((p, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2.5">
              <input placeholder="Name" value={p.name} onChange={(e) => setPartnerPayouts((prev) => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} className={cn(inputClass, 'flex-1')} />
              <input type="number" step="any" placeholder="%" value={p.percentage || ''} onChange={(e) => setPartnerPayouts((prev) => prev.map((x, idx) => idx === i ? { ...x, percentage: e.target.value === '' ? 0 : Number(e.target.value) } : x))} className={cn(inputClass, 'w-20')} />
              <input type="number" step="any" placeholder="Amount (₹)" value={p.amount || ''} onChange={(e) => setPartnerPayouts((prev) => prev.map((x, idx) => idx === i ? { ...x, amount: e.target.value === '' ? 0 : Number(e.target.value) } : x))} className={cn(inputClass, 'w-32')} />
              <select value={p.status} onChange={(e) => setPartnerPayouts((prev) => prev.map((x, idx) => idx === i ? { ...x, status: e.target.value as PayoutStatus } : x))} className={cn(inputClass, 'w-28')}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
              <RemoveRowButton onClick={() => setPartnerPayouts((prev) => prev.filter((_, idx) => idx !== i))} />
            </div>
          ))}
          <AddRowButton label="Add Payout" onClick={() => setPartnerPayouts((prev) => [...prev, { name: '', percentage: 0, amount: 0, status: 'pending' }])} />
        </div>
      </Card>

      <Card title="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional freeform notes" className={cn(inputClass, 'w-full')} />
      </Card>

      <Card title="Original Report PDF">
        <input ref={fileInputRef} type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="hidden" id="report-pdf-input" />
        <label htmlFor="report-pdf-input" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-border px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-muted">
          <UploadCloud size={16} />
          {pdfFile ? pdfFile.name : existingPdfUrl ? 'Replace the uploaded PDF' : 'Attach the monthly report PDF'}
        </label>
        {existingPdfUrl && !pdfFile && (
          <a href={existingPdfUrl} target="_blank" rel="noopener noreferrer" className="ml-3 text-sm text-primary hover:underline">
            View current file
          </a>
        )}
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/reports')}>Cancel</Button>
        <Button type="submit" isLoading={submitting}>{isEdit ? 'Save Changes' : 'Create Report'}</Button>
      </div>
    </form>
  );
}

// [appearance:textfield] + the two spin-button rules hide the native
// up/down stepper — every numeric field here should just be a plain,
// freely-editable box, not a counter.
const inputClass = 'rounded-lg border border-brand-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-card p-5">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-dashed border-brand-border px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5">
      <Plus size={15} /> {label}
    </button>
  );
}

function RemoveRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15">
      <Trash2 size={15} />
    </button>
  );
}

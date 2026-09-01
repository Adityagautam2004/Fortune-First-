'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud } from 'lucide-react';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { MonthlyReport } from './types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function n(setter: (v: number) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value === '' ? 0 : Number(e.target.value));
}

interface ReportFormPageProps {
  reportId?: string; // present when editing
}

// Shared create/edit form for /admin/reports/new and /admin/reports/:id/edit
// — deliberately simple: month/year, three headline numbers, and the PDF
// itself as the actual artifact.
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
  const [operatingCapitalTotal, setOperatingCapitalTotal] = useState(0);
  const [totalPayout, setTotalPayout] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/board/reports/${reportId}`).then((res) => {
      const r: MonthlyReport = res.data.data;
      setMonth(r.month);
      setYear(r.year);
      setOperatingCapitalTotal(Number(r.operating_capital_total));
      setTotalPayout(Number(r.total_payout));
      setTotalProfit(Number(r.total_profit));
      setExistingPdfUrl(r.pdf_url);
    }).catch((err) => setError(getErrorMessage(err, 'Failed to load report.')))
      .finally(() => setLoading(false));
  }, [isEdit, reportId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEdit && !pdfFile) {
      setError('Please attach the report PDF.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('month', String(month));
      formData.append('year', String(year));
      formData.append('operatingCapitalTotal', String(operatingCapitalTotal));
      formData.append('totalPayout', String(totalPayout));
      formData.append('totalProfit', String(totalProfit));
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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 pb-10">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{isEdit ? 'Edit Report' : 'Add Report'}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Monthly firm-wide result.</p>
      </div>

      <div className="rounded-2xl border border-brand-border bg-card p-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Month">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputClass}>
              {MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
            </select>
          </Field>
          <Field label="Year">
            <input type="number" value={year || ''} onChange={n(setYear)} className={inputClass} />
          </Field>
          <Field label="Total Operating Capital for Next Month (₹)">
            <input type="number" step="any" value={operatingCapitalTotal || ''} onChange={n(setOperatingCapitalTotal)} className={inputClass} />
          </Field>
          <Field label="Total Payout (₹)">
            <input type="number" step="any" value={totalPayout || ''} onChange={n(setTotalPayout)} className={inputClass} />
          </Field>
          <Field label="Total Profit (₹)">
            <input type="number" step="any" value={totalProfit || ''} onChange={n(setTotalProfit)} className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-card p-5">
        <p className="mb-3 text-sm font-bold text-foreground">Report PDF</p>
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
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/reports')}>Cancel</Button>
        <Button type="submit" isLoading={submitting}>{isEdit ? 'Save Changes' : 'Create Report'}</Button>
      </div>
    </form>
  );
}

const inputClass = 'rounded-lg border border-brand-border px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

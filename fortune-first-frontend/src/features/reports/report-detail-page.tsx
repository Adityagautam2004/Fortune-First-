'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Download, FileText, Pencil, Trash2 } from 'lucide-react';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { MonthlyReport } from './types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatRupees(value: number | string) {
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function signedRupees(value: number | string) {
  const num = Number(value);
  return `${num >= 0 ? '+' : ''}${formatRupees(num)}`;
}

function nextMonthLabel(month: number, year: number) {
  const next = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${MONTH_NAMES[next - 1]} ${nextYear}`;
}

interface ReportDetailPageProps {
  reportId: string;
}

// Shared by /board/reports/:id (view only) and /admin/reports/:id (full
// management) — an in-app rendering of the same data the generated PDF
// shows, so viewers don't have to open a PDF just to check one number.
export function ReportDetailPage({ reportId }: ReportDetailPageProps) {
  const { user } = useAuth();
  const canManage = user?.role === 'super_admin';
  const pathname = usePathname();
  const basePath = pathname?.startsWith('/admin') ? '/admin/reports' : '/board/reports';

  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/board/reports/${reportId}`)
      .then((res) => setReport(res.data.data))
      .catch((error) => console.error('Failed to load report', error))
      .finally(() => setLoading(false));
  }, [reportId]);

  const handleDelete = async () => {
    if (!confirm('Delete this monthly report? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/reports/${reportId}`);
      window.location.href = basePath;
    } catch (error) {
      console.error('Failed to delete report', error);
      alert('Failed to delete report.');
    }
  };

  if (loading) return <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>;
  if (!report) return <p className="py-10 text-center text-sm text-muted-foreground">Report not found.</p>;

  const monthLabel = `${MONTH_NAMES[report.month - 1]} ${report.year}`;
  const nextLabel = nextMonthLabel(report.month, report.year);
  const companyLoss = Number(report.company_result_amount) < 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={basePath} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{monthLabel} Result and Record</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Monthly firm-wide report</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {report.pdf_url && (
            <a href={report.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted">
              <FileText size={15} /> <span className="hidden sm:inline">Original PDF</span>
            </a>
          )}
          {report.generated_pdf_url && (
            <a href={report.generated_pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <Download size={15} /> <span className="hidden sm:inline">Download PDF</span>
            </a>
          )}
          {canManage && (
            <>
              <Link href={`${basePath}/${reportId}/edit`} className="rounded-lg border border-brand-border p-2.5 text-muted-foreground hover:bg-muted">
                <Pencil size={15} />
              </Link>
              <button onClick={handleDelete} className="rounded-lg border border-brand-border p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15">
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Headline bullets */}
      <div className="rounded-2xl border border-brand-border bg-card p-5">
        <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
          <li>
            Overall profit {Number(report.overall_profit_percentage).toFixed(2)}% of {formatRupees(report.total_aum_next_month)} ={' '}
            <span className={cn('font-bold', Number(report.overall_profit_amount) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
              {signedRupees(report.overall_profit_amount)}
            </span>
            {report.members.length > 0 && (
              <>
                {' ('}
                {report.members.map((m, i) => (
                  <span key={m.name}>
                    {i > 0 && ', '}
                    {m.name}-{' '}
                    <span className={cn('font-semibold', m.profitLossAmount >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {signedRupees(m.profitLossAmount)}
                    </span>
                  </span>
                ))}
                {')'}
              </>
            )}
            .
          </li>
          <li>NAV = {Number(report.nav_updated).toFixed(2)}.</li>
          <li>
            Clients payout percentage for {MONTH_NAMES[report.month - 1]} is {Number(report.client_payout_percentage).toFixed(2)}% and is valued at{' '}
            {formatRupees(report.client_total_money)} and is = {formatRupees(report.client_payout_amount)}.
          </li>
          <li>
            Company&apos;s {companyLoss ? 'loss' : 'profit'} after Clients payout ={' '}
            <span className={cn('rounded px-2 py-0.5 font-bold', companyLoss ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400')}>
              {formatRupees(Math.abs(Number(report.company_result_amount)))}
            </span>
          </li>
          <li>
            {Number(report.profit_saving_percentage).toFixed(2)}% company profit saving = {formatRupees(report.profit_saving_amount)} left- {formatRupees(report.profit_saving_left_amount)}
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Section title={`Payout (1st ${nextLabel.split(' ')[0]})`}>
          {report.partner_payouts.map((p) => (
            <li key={p.name}>
              {p.name} ➡️ {Number(p.percentage).toFixed(2)}% of {MONTH_NAMES[report.month - 1]} = <b>{formatRupees(p.amount)}</b>{' '}
              <StatusPill status={p.status} />
            </li>
          ))}
          <li>Client payout = {formatRupees(report.client_payout_amount)} <StatusPill status={report.client_payout_status} /></li>
          <li>Employees = <b>{formatRupees(report.employees_payout_amount)}</b></li>
        </Section>

        <Section title="Updated Investment Pattern" subtitle={`For ${nextLabel}`}>
          {report.investment_pattern.length === 0 ? (
            <EmptyNote />
          ) : (
            report.investment_pattern.map((m) => (
              <li key={m.name}>{m.name} = {formatRupees(m.amount)}</li>
            ))
          )}
        </Section>

        <Section title="Withdrawals" subtitle={nextLabel.split(' ')[0]}>
          {report.withdrawals.length === 0 ? <EmptyNote text="No withdrawals recorded." /> : report.withdrawals.map((w, i) => (
            <li key={i}><b>{formatRupees(w.amount)}</b> — {w.description}</li>
          ))}
        </Section>

        <Section title="Investments">
          {report.investments.length === 0 ? <EmptyNote text="No investments recorded." /> : report.investments.map((inv, i) => (
            <li key={i}><b>{formatRupees(inv.amount)}</b> — {inv.description}</li>
          ))}
        </Section>
      </div>

      <div className="rounded-2xl border border-brand-border bg-card p-5">
        <h2 className="text-sm font-bold text-foreground">
          Operating Capital For the month of {nextLabel.split(' ')[0]} :={' '}
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            {formatRupees(report.operating_capital_total)}
          </span>
        </h2>

        {report.members.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-muted text-foreground">
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Name</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Personal AUM</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">P&amp;L</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">R&amp;D Cost</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Investment Recv.</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Withdrawal</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Client Money</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Payout %</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Payout Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.members.map((m) => (
                  <tr key={m.name}>
                    <td className="px-4 py-2.5 font-semibold text-foreground">{m.name}</td>
                    <td className="px-4 py-2.5 text-foreground">{formatRupees(m.personalAum)}</td>
                    <td className={cn('px-4 py-2.5 font-semibold', m.profitLossAmount >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {signedRupees(m.profitLossAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{formatRupees(m.rdCost)}</td>
                    <td className="px-4 py-2.5 text-foreground">{formatRupees(m.investmentReceived)}</td>
                    <td className="px-4 py-2.5 text-foreground">{formatRupees(m.withdrawalAmount)}</td>
                    <td className="px-4 py-2.5 text-foreground">{formatRupees(m.clientMoney)}</td>
                    <td className="px-4 py-2.5 text-foreground">{Number(m.payoutPercentage).toFixed(2)}%</td>
                    <td className="px-4 py-2.5 text-foreground">{formatRupees(m.payoutAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {report.notes && (
        <div className="rounded-2xl border border-brand-border bg-card p-5">
          <h2 className="text-sm font-bold text-foreground">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{report.notes}</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-card p-5">
      <h2 className="text-sm font-bold text-foreground">
        {title} {subtitle && <span className="font-normal text-muted-foreground">({subtitle})</span>}
      </h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground">{children}</ul>
    </div>
  );
}

function EmptyNote({ text = 'None recorded.' }: { text?: string }) {
  return <li className="list-none text-muted-foreground italic">{text}</li>;
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn(
      'ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
      status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
    )}>
      {status}
    </span>
  );
}

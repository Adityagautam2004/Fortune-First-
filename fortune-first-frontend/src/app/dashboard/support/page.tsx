'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  MessageCircle,
  Send,
  Mail,
  User,
  CheckCircle2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'Open' | 'Resolved';
  created_at: string;
}

const SUBJECT_OPTIONS = ['Payout Issue', 'Investment Query', 'Account Issue', 'Other'];
const MESSAGE_LIMIT = 1000;
const PAGE_SIZE = 5;

function formatCreatedOn(value: string) {
  const date = new Date(value);
  const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '');
  return `${datePart}, ${timePart}`;
}

function TicketStatusBadge({ status }: { status: string }) {
  const isResolved = status === 'Resolved';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${isResolved
          ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
          : 'border-red-200 bg-red-50 text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400'
        }`}
    >
      {status}
    </span>
  );
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [form, setForm] = useState({ subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const fetchTickets = async () => {
    const res = await api.get('/customer/support');
    setTickets(res.data.data);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const totalPages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE));
  const pageRows = useMemo(() => tickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [tickets, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject) return;
    setSubmitting(true);
    try {
      // The redesigned form only exposes one "Subject" dropdown; its value is
      // sent as both subject and category to satisfy the existing (unchanged)
      // API contract, which requires both as separate NOT NULL columns.
      await api.post('/customer/support', { subject: form.subject, category: form.subject, message: form.message });
      setForm({ subject: '', message: '' });
      setPage(1);
      fetchTickets();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">Raise a query or track your existing support tickets.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-brand-border bg-card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-2">
            <MessageCircle size={22} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">Raise a Query</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Subject</label>
              <select
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-brand-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  Select Subject
                </option>
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Message</label>
              <textarea
                required
                rows={5}
                maxLength={MESSAGE_LIMIT}
                placeholder="Describe your issue in detail..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-none rounded-lg border border-brand-border bg-card px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {form.message.length}/{MESSAGE_LIMIT}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
              <Send size={16} />
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-6">
          <div className="mb-2 flex justify-center">
            <Mail size={56} strokeWidth={1.5} className="text-primary" />
          </div>
          <h2 className="mb-5 text-center text-lg font-bold text-primary">How It Works</h2>
          <ul className="space-y-5">
            <li className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary">
                <Mail size={16} />
              </span>
              <p className="text-sm text-foreground">
                When you raise a new ticket, your assigned Business Head will receive an email notification.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary">
                <User size={16} />
              </span>
              <p className="text-sm text-foreground">Our team will review your query and get back to you as soon as possible.</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary">
                <CheckCircle2 size={16} />
              </span>
              <p className="text-sm text-foreground">You can track the status of all your tickets below.</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-card">
        <div className="flex items-center gap-2 p-6 pb-4">
          <ClipboardList size={22} className="text-primary" />
          <h2 className="text-lg font-bold text-primary">Your Support Tickets</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                <th className="px-6 py-3 font-medium">Ticket ID</th>
                <th className="px-6 py-3 font-medium">Subject</th>
                <th className="px-6 py-3 font-medium">Created On</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                    You haven&apos;t raised any support tickets yet.
                  </td>
                </tr>
              ) : (
                pageRows.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-4 font-medium text-foreground">#TKT-{t.id.slice(0, 5).toUpperCase()}</td>
                    <td className="px-6 py-4 text-foreground">{t.subject}</td>
                    <td className="px-6 py-4 text-foreground">{formatCreatedOn(t.created_at)}</td>
                    <td className="px-6 py-4">
                      <TicketStatusBadge status={t.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {tickets.length > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-1.5 border-t border-brand-border px-6 py-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${n === page ? 'bg-primary text-white' : 'border border-brand-border text-muted-foreground hover:bg-muted'
                  }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

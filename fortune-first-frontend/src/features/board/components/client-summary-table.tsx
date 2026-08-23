'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download, MoreHorizontal } from 'lucide-react';

import { downloadCsv } from '@/lib/csv';
import type { BoardClient } from '../types';

const PAGE_SIZE = 8;

function formatCrore(value: number) {
  return `₹${(value / 1e7).toFixed(2)} Cr`;
}

interface ClientSummaryTableProps {
  clients: BoardClient[];
}

export function ClientSummaryTable({ clients }: ClientSummaryTableProps) {
  const [page, setPage] = useState(1);
  const [prevClients, setPrevClients] = useState(clients);

  if (clients !== prevClients) {
    setPrevClients(clients);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [clients, page]
  );
  const rangeStart = clients.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, clients.length);

  const handleDownload = () => {
    downloadCsv(
      'client_summary.csv',
      clients.map((c) => ({
        'Client Name': c.name,
        'Client ID': c.id,
        'Relationship Manager': c.relationship_manager || '—',
        'AUM (INR)': Number(c.total_invested),
        'Active Mandates': Number(c.active_mandates),
        'Client Status': c.is_active ? 'Active' : 'Inactive',
      }))
    );
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-card">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-lg font-bold text-foreground">Client Summary</h3>
        <button
          onClick={handleDownload}
          disabled={clients.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={15} />
          Download Table
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted text-foreground">
              <th className="whitespace-nowrap px-6 py-3 font-medium">Client Name</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Client ID</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Relationship Manager</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Segment</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">AUM (₹)</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Active Mandate</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Risk Profile</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Client Status</th>
              <th className="whitespace-nowrap px-6 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-muted-foreground">
                  No clients match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map((client) => (
                <tr key={client.id}>
                  <td className="px-6 py-4 font-medium text-foreground">{client.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    {client.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-foreground">{client.relationship_manager || '—'}</td>
                  <td className="px-6 py-4 text-muted-foreground">—</td>
                  <td className="px-6 py-4 font-medium text-primary">{formatCrore(Number(client.total_invested))}</td>
                  <td className="px-6 py-4 text-foreground">{client.active_mandates}</td>
                  <td className="px-6 py-4 text-muted-foreground">—</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        client.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {client.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/board/clients/${client.id}`}
                      className="inline-flex h-7 w-9 items-center justify-center rounded-md border border-brand-border text-muted-foreground hover:bg-muted"
                      aria-label={`View ${client.name}`}
                    >
                      <MoreHorizontal size={16} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-brand-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {clients.length === 0
            ? 'No clients'
            : `Showing ${rangeStart} to ${rangeEnd} of ${clients.length} entries`}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
            .reduce<(number | 'ellipsis')[]>((acc, n, idx, arr) => {
              if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
              acc.push(n);
              return acc;
            }, [])
            .map((n, idx) =>
              n === 'ellipsis' ? (
                <span key={`e-${idx}`} className="px-1 text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                    n === page ? 'bg-primary text-white' : 'border border-brand-border text-foreground hover:bg-muted'
                  }`}
                >
                  {n}
                </button>
              )
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

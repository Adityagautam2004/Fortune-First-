'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface BoardClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  total_invested: string;
  client_code?: string | null;
}

interface ClientListPageProps {
  /** Route prefix for the "View Details" link — differs between the board
   * and admin panels even though both hit the same GET /board/clients API
   * (already unscoped for business_head/super_admin, per-assigned-client for
   * investment_head). */
  basePath: string;
  title?: string;
}

// Shared by /board/clients (investment_head/business_head) and
// /admin/client-details (super_admin).
export function ClientListPage({ basePath, title = 'Clients' }: ClientListPageProps) {
  const [clients, setClients] = useState<BoardClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/board/clients').then((res) => {
      setClients(res.data.data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">{title}</h1>

      {loading ? (
        <div className="rounded-xl border border-brand-border bg-card p-4 text-center text-sm text-muted-foreground">
          Loading clients...
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-brand-border bg-card p-4 text-center text-sm text-muted-foreground">
          No clients found.
        </div>
      ) : (
        <>
          {/* Card list — mobile only, so every field is visible without side-scrolling. */}
          <div className="space-y-3 md:hidden">
            {clients.map((client) => (
              <div key={client.id} className="rounded-xl border border-brand-border bg-card p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{client.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{client.client_code || '—'}</p>
                  </div>
                  <Link href={`${basePath}/${client.id}`} className="shrink-0 text-sm font-medium text-brand-orange hover:underline">
                    View Details
                  </Link>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Email</span>
                    <span className="break-all text-right text-foreground">{client.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="text-foreground">{client.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Total Invested</span>
                    <span className="font-medium text-foreground">₹{parseFloat(client.total_invested).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table — tablet/desktop only. */}
          <div className="hidden overflow-x-auto rounded-xl border border-brand-border bg-card shadow-sm md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-surface text-foreground">
                  <th className="p-4 text-sm font-medium">Client ID</th>
                  <th className="p-4 text-sm font-medium">Name</th>
                  <th className="p-4 text-sm font-medium">Email</th>
                  <th className="p-4 text-sm font-medium">Phone</th>
                  <th className="p-4 text-sm font-medium">Total Invested</th>
                  <th className="p-4 text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-muted">
                    <td className="p-4 text-sm font-mono text-muted-foreground">{client.client_code || '—'}</td>
                    <td className="p-4 text-sm font-medium">{client.name}</td>
                    <td className="p-4 text-sm">{client.email}</td>
                    <td className="p-4 text-sm">{client.phone || 'N/A'}</td>
                    <td className="p-4 text-sm">₹{parseFloat(client.total_invested).toLocaleString()}</td>
                    <td className="p-4 text-sm">
                      <Link href={`${basePath}/${client.id}`}>
                        <button className="text-brand-orange hover:underline text-sm font-medium">View Details</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

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
      <div className="bg-card rounded-xl shadow-sm border border-brand-border overflow-x-auto">
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
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center">Loading clients...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No clients found.</td></tr>
            ) : clients.map((client) => (
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
    </div>
  );
}

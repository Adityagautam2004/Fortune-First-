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
}

export default function BoardClientsPage() {
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
      <h1 className="text-3xl font-bold text-brand-navy mb-6">My Clients</h1>
      <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-surface text-brand-navy">
              <th className="p-4 text-sm font-medium">Name</th>
              <th className="p-4 text-sm font-medium">Email</th>
              <th className="p-4 text-sm font-medium">Phone</th>
              <th className="p-4 text-sm font-medium">Total Invested</th>
              <th className="p-4 text-sm font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center">Loading clients...</td></tr>
            ) : clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="p-4 text-sm font-medium">{client.name}</td>
                <td className="p-4 text-sm">{client.email}</td>
                <td className="p-4 text-sm">{client.phone || 'N/A'}</td>
                <td className="p-4 text-sm">₹{parseFloat(client.total_invested).toLocaleString()}</td>
                <td className="p-4 text-sm">
                  <Link href={`/board/clients/${client.id}`}>
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

'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);

  const fetchTickets = async () => {
    const res = await api.get('/admin/support');
    setTickets(res.data.data);
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleResolve = async (id: string) => {
    try {
      await api.patch(`/admin/support/${id}/resolve`);
      fetchTickets();
    } catch (error) {
      alert('Failed to resolve ticket');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-navy mb-6">Support Tickets</h1>
      <div className="space-y-4">
        {tickets.map((t: any) => (
          <div key={t.id} className="bg-white p-6 rounded-xl shadow-sm border border-brand-border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">{t.subject}</h3>
                <p className="text-sm text-gray-500">From: {t.customer_name} ({t.email}) | Category: {t.category}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                t.status === 'Open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {t.status}
              </span>
            </div>
            <div className="bg-brand-surface p-4 rounded-md mb-4 text-sm text-gray-700">
              {t.message}
            </div>
            {t.status === 'Open' && (
              <button 
                onClick={() => handleResolve(t.id)} 
                className="bg-brand-navy text-white px-4 py-2 rounded-md text-sm hover:bg-opacity-90"
              >
                Mark as Resolved
              </button>
            )}
          </div>
        ))}
        {tickets.length === 0 && <p className="text-gray-500">No support tickets found.</p>}
      </div>
    </div>
  );
}
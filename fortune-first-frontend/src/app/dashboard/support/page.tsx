'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'Open' | 'Resolved';
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [form, setForm] = useState({ subject: '', category: 'Payout Issue', message: '' });

  const fetchTickets = async () => {
    const res = await api.get('/customer/support');
    setTickets(res.data.data);
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/customer/support', form);
    setForm({ subject: '', category: 'Payout Issue', message: '' });
    fetchTickets();
  };

  return (
    <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-6">Raise a Query</h1>
        <form onSubmit={handleSubmit} className="bg-card p-6 rounded-xl shadow-sm border border-brand-border space-y-4">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select 
              value={form.category} 
              onChange={e => setForm({...form, category: e.target.value})}
              className="mt-1 w-full border rounded-md p-2"
            >
              <option>Payout Issue</option>
              <option>Investment Query</option>
              <option>Account Issue</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Subject</label>
            <input 
              required type="text" value={form.subject} 
              onChange={e => setForm({...form, subject: e.target.value})}
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Message</label>
            <textarea 
              required rows={4} value={form.message} 
              onChange={e => setForm({...form, message: e.target.value})}
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>
          <button type="submit" className="bg-brand-navy text-white px-4 py-2 rounded-md">Submit Ticket</button>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Your Tickets</h2>
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="bg-card p-4 rounded-xl shadow-sm border border-brand-border">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{t.subject}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'Open' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400' : 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400'}`}>
                  {t.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Category: {t.category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function AddInvestmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState({
    amount: 5000,
    investmentDate: new Date().toISOString().split('T')[0],
    weekOfMonth: 1,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/board/investments', { ...form, customerId: params.id });
      alert('Investment recorded successfully!');
      router.push('/board/clients');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add investment');
    }
  };

  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-brand-border">
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Record New Investment</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount (Multiple of ₹5000)</label>
          <input 
            type="number" min="5000" step="5000" required
            value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})}
            className="mt-1 w-full border rounded-md p-2 focus:border-brand-orange"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input 
              type="date" required value={form.investmentDate} 
              onChange={e => setForm({...form, investmentDate: e.target.value})}
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Week of Month (1-4)</label>
            <input 
              type="number" min="1" max="4" required value={form.weekOfMonth} 
              onChange={e => setForm({...form, weekOfMonth: Number(e.target.value)})}
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Notes</label>
          <textarea 
            value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
            className="mt-1 w-full border rounded-md p-2" rows={3}
          />
        </div>
        <button type="submit" className="bg-brand-navy text-white px-4 py-2 rounded-md w-full">
          Record Investment
        </button>
      </form>
    </div>
  );
}
'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function ProcessPayoutsPage() {
  const [investmentId, setInvestmentId] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [returnPct, setReturnPct] = useState(2.0);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/board/payouts', {
        investmentId, month, year, returnPct
      });
      alert(`Success! Calculated payout amount: ₹${res.data.data.payoutAmount}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Payout processing failed');
    }
  };

  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-brand-border">
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Process Monthly Payout</h1>
      <form onSubmit={handleProcess} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Investment ID (UUID)</label>
          <input 
            type="text" required value={investmentId} 
            onChange={e => setInvestmentId(e.target.value)}
            className="mt-1 w-full border rounded-md p-2"
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Month (1-12)</label>
            <input 
              type="number" min="1" max="12" required value={month} 
              onChange={e => setMonth(Number(e.target.value))}
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Year</label>
            <input 
              type="number" required value={year} 
              onChange={e => setYear(Number(e.target.value))}
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Return %</label>
            <input 
              type="number" step="0.1" required value={returnPct} 
              onChange={e => setReturnPct(Number(e.target.value))}
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md w-full font-medium hover:bg-green-700">
          Mark as Paid
        </button>
      </form>
    </div>
  );
}
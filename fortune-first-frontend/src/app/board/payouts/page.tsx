'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

function PayoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Grab the hidden data from the URL
  const investmentId = searchParams.get('investmentId');
  const amount = searchParams.get('amount');

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [returnPct, setReturnPct] = useState(2.0);
  const [loading, setLoading] = useState(false);

  if (!investmentId) {
    return <div className="text-red-600 p-4">Error: No investment selected. Please go back to the client profile.</div>;
  }

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/board/payouts', {
        investmentId, month, year, returnPct
      });
      alert(`Success! Calculated payout amount: ₹${res.data.data.payoutAmount}`);
      router.back(); // Send them back to the client profile
    } catch (error: any) {
      alert(error.response?.data?.message || 'Payout processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleProcess} className="space-y-4">
      <div className="bg-brand-surface p-4 rounded-md mb-4 border border-brand-border">
        <p className="text-sm text-gray-600">Processing for Investment Amount:</p>
        <p className="text-2xl font-bold text-brand-navy">₹{parseFloat(amount || '0').toLocaleString()}</p>
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
            className="mt-1 w-full border rounded-md p-2 focus:border-brand-orange"
          />
        </div>
      </div>
      <button 
        type="submit" disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded-md w-full font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Mark as Paid'}
      </button>
    </form>
  );
}

export default function ProcessPayoutsPage() {
  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-brand-border">
      <h1 className="text-2xl font-bold text-brand-navy mb-6">Process Monthly Payout</h1>
      {/* Suspense is required when using useSearchParams in Next.js */}
      <Suspense fallback={<div>Loading payout details...</div>}>
        <PayoutForm />
      </Suspense>
    </div>
  );
}

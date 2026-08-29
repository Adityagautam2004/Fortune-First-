'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { PayoutHistoryPage } from '@/features/admin/payout-history-page';

function PayoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Grab the hidden data from the URL
  const investmentId = searchParams?.get('investmentId') ?? null;
  const amount = searchParams?.get('amount') ?? null;

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [returnPct, setReturnPct] = useState(2.0);
  const [loading, setLoading] = useState(false);

  // Arriving here directly from the sidebar (no specific payout to process)
  // shows the payout history instead of a dead-end error.
  if (!investmentId) {
    return <PayoutHistoryPage endpoint="/board/payouts" />;
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
    } catch (error) {
      alert(getErrorMessage(error, 'Payout processing failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl rounded-xl border border-brand-border bg-card p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Process Monthly Payout</h1>
      <form onSubmit={handleProcess} className="space-y-4">
        <div className="bg-brand-surface p-4 rounded-md mb-4 border border-brand-border">
          <p className="text-sm text-foreground">Processing for Investment Amount:</p>
          <p className="text-2xl font-bold text-foreground">₹{parseFloat(amount || '0').toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
    </div>
  );
}

export default function PayoutFormClient() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-foreground">Monthly Payout</h1>
      {/* Suspense is required when using useSearchParams in Next.js */}
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <PayoutForm />
      </Suspense>
    </div>
  );
}

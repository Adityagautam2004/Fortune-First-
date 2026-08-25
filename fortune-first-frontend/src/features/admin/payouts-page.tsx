'use client';

import { useEffect, useMemo, useState } from 'react';

import api from '@/lib/api';
import { PayoutFilters } from './components/payout-filters';
import { PayoutTable } from './components/payout-table';
import type { PendingPayout } from './types';

export function PayoutsPage() {
  const [investments, setInvestments] = useState<PendingPayout[]>([]);
  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPending = () => {
    // Moved under /board/* — board.routes.js's role gate now includes
    // super_admin, so the duplicate /admin/payouts/pending mount that used
    // to exist purely to work around that gate has been removed.
    return api
      .get('/board/payouts/pending')
      .then((res) => {
        setInvestments(res.data.data.investments || []);
        setMonth(res.data.data.month);
        setYear(res.data.data.year);
      })
      .catch((error) => console.error('Failed to load pending payouts', error));
  };

  useEffect(() => {
    fetchPending().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return investments;
    const q = search.toLowerCase();
    return investments.filter(
      (inv) => inv.client_name.toLowerCase().includes(q) || inv.customer_id.toLowerCase().includes(q)
    );
  }, [investments, search]);

  const handleMarkPaid = async (investmentId: string, returnPct: number) => {
    if (!month || !year) return;
    try {
      await api.post('/board/payouts', { investmentId, month, year, returnPct });
      await fetchPending();
    } catch (error) {
      console.error('Failed to process payout', error);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading pending payouts...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">Payouts &gt; Process Payouts</p>
        <h1 className="mt-1 text-2xl font-extrabold text-foreground">Process Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Calculate returns and mark payouts as paid for clients.</p>
      </div>

      <PayoutFilters search={search} onSearchChange={setSearch} onReset={() => setSearch('')} />

      <PayoutTable investments={filtered} month={month ?? 0} year={year ?? 0} onMarkPaid={handleMarkPaid} />
    </div>
  );
}

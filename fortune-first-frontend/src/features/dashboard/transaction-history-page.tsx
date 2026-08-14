'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';

import api from '@/lib/api';
import type { MonthlyReturn } from '@/types';
import { TransactionFilters, type TransactionFiltersState } from './components/transaction-filters';
import { TransactionTable } from './components/transaction-table';

const MONTH_LABELS = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const EMPTY_FILTERS: TransactionFiltersState = {
  startDate: '',
  endDate: '',
  status: 'all',
  search: '',
};

export function TransactionHistoryPage() {
  const [history, setHistory] = useState<MonthlyReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [filters, setFilters] = useState<TransactionFiltersState>(EMPTY_FILTERS);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/customer/investments')
      .then((res) => {
        if (!cancelled) setHistory(res.data.data || []);
      })
      .catch((error) => console.error('Failed to load transaction history', error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter((record) => {
      if (filters.status !== 'all' && record.payout_status !== filters.status) return false;

      if (record.payout_date) {
        const recordDate = record.payout_date.slice(0, 10);
        if (filters.startDate && recordDate < filters.startDate) return false;
        if (filters.endDate && recordDate > filters.endDate) return false;
      }

      if (filters.search) {
        const haystack = [
          MONTH_LABELS[record.month],
          String(record.year),
          String(record.payout_amount),
          record.payout_status,
          'Monthly Payout',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }

      return true;
    });
  }, [history, filters]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/customer/report/full', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Fortune_First_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading your transactions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-brand-border bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Transaction History</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all your past transactions, interest credits and withdrawals.
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} />
          {downloading ? 'Preparing...' : 'Download'}
        </button>
      </div>

      <TransactionFilters filters={filters} onChange={setFilters} />

      <TransactionTable history={filteredHistory} />
    </div>
  );
}

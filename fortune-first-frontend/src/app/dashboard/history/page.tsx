'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface HistoryRecord {
  month: number;
  year: number;
  invested_amount: string;
  return_pct: string;
  payout_amount: string;
  payout_status: string;
  payout_date: string | null;
}

export default function InvestmentHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/customer/investments');
        setHistory(res.data.data);
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Investment History</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-navy text-white">
              <th className="p-4 text-sm font-medium">Period</th>
              <th className="p-4 text-sm font-medium">Invested (₹)</th>
              <th className="p-4 text-sm font-medium">Return %</th>
              <th className="p-4 text-sm font-medium">Payout (₹)</th>
              <th className="p-4 text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center">Loading data...</td></tr>
            ) : history.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center">No investment history found.</td></tr>
            ) : (
              history.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="p-4 text-sm">{record.month}/{record.year}</td>
                  <td className="p-4 text-sm">{record.invested_amount}</td>
                  <td className="p-4 text-sm">{record.return_pct}%</td>
                  <td className="p-4 text-sm">{record.payout_amount}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.payout_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.payout_status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
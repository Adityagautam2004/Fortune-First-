'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [activeInvestments, setActiveInvestments] = useState([]);

  useEffect(() => {
    // Fetch profile & history
    api.get(`/board/clients/${id}`).then((res) => setData(res.data.data));
    // Fetch active investments for payout processing
    api.get(`/board/clients/${id}/investments/active`).then((res) => setActiveInvestments(res.data.data));
  }, [id]);

  if (!data) return <div className="p-8">Loading client data...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-navy">{data.profile.name}'s Portfolio</h1>
        <Link href={`/board/clients/${id}/invest`}>
          <button className="bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-opacity-90">
            + Add New Investment
          </button>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-border mb-8">
        <p><strong>Email:</strong> {data.profile.email}</p>
        <p><strong>Phone:</strong> {data.profile.phone || 'N/A'}</p>
      </div>

      {/* NEW: Active Investments Table */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Investments</h2>
      <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-surface text-brand-navy">
              <th className="p-4 text-sm font-medium">Date</th>
              <th className="p-4 text-sm font-medium">Amount (₹)</th>
              <th className="p-4 text-sm font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activeInvestments.length === 0 ? (
              <tr><td colSpan={3} className="p-4 text-center">No active investments.</td></tr>
            ) : (
              activeInvestments.map((inv: any) => (
                <tr key={inv.id}>
                  <td className="p-4 text-sm">{new Date(inv.investment_date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm font-bold">₹{parseFloat(inv.amount).toLocaleString()}</td>
                  <td className="p-4 text-sm">
                    {/* Passes the exact UUID silently through the URL */}
                    <Link href={`/board/payouts?investmentId=${inv.id}&amount=${inv.amount}`}>
                      <button className="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-green-700">
                        Process Payout
                      </button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">Payout History</h2>
      {/* ... Keep your existing data.history table here ... */}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setStats(res.data.data));
  }, []);

  if (!stats) return <div className="p-8">Loading system analytics...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">System Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-border">
          <p className="text-sm text-gray-500 font-medium">Total Clients</p>
          <p className="text-3xl font-bold text-brand-navy mt-2">{stats.totalClients}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-border">
          <p className="text-sm text-gray-500 font-medium">Total AUM</p>
          <p className="text-3xl font-bold text-green-600 mt-2">₹{stats.totalAum.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-border">
          <p className="text-sm text-gray-500 font-medium">Payouts Disbursed (This Month)</p>
          <p className="text-3xl font-bold text-brand-orange mt-2">₹{stats.monthlyPayouts.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}


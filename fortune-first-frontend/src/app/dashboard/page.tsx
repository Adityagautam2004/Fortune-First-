'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface DashboardStats {
  totalInvested: number;
  currentValue: number;
  cagr: number;
  thisMonthReturn: number;
}

export default function CustomerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/customer/dashboard');
        setStats(res.data.data);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading your portfolio...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Overview</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Invested', value: `₹${stats?.totalInvested.toLocaleString()}` },
          { label: 'Current Value', value: `₹${stats?.currentValue.toLocaleString()}` },
          { label: 'CAGR', value: `${stats?.cagr}%` },
          { label: "This Month's Return", value: `₹${stats?.thisMonthReturn.toLocaleString()}` }
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-brand-border">
            <p className="text-sm text-gray-500 font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-brand-navy mt-2">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
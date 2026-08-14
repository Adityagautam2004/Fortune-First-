'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

import type { MonthlyReturn } from '@/types';

const MONTH_LABELS = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const RANGE_OPTIONS = [
  { label: 'Last 6 Months', months: 6 },
  { label: 'Last 12 Months', months: 12 },
];

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface PortfolioGrowthChartProps {
  history: MonthlyReturn[];
}

export function PortfolioGrowthChart({ history }: PortfolioGrowthChartProps) {
  const [range, setRange] = useState(12);

  const chartData = useMemo(() => {
    const sorted = [...history].sort((a, b) => a.year - b.year || a.month - b.month);
    return sorted.slice(-range).map((record) => ({
      label: `${MONTH_LABELS[record.month]} ${record.year}`,
      value: Number(record.payout_amount) || 0,
    }));
  }, [history, range]);

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Portfolio Growth</h3>
        <select
          value={range}
          onChange={(e) => setRange(Number(e.target.value))}
          className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-sm text-gray-600 focus:border-primary focus:outline-none"
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.months} value={opt.months}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-gray-400">
          No payout history yet.
        </div>
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatRupees(v)}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #f97316',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => [formatRupees(Number(value)), 'Payout']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(v) => formatRupees(Number(v))}
                  style={{ fill: '#111827', fontSize: 10, fontWeight: 600 }}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

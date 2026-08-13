'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const MONTHLY_PAYOUTS = [
  { month: 'Apr\n2025', value: 15.6 },
  { month: 'May', value: 17.2 },
  { month: 'Jun', value: 17.9 },
  { month: 'Jul', value: 19.8 },
  { month: 'Aug', value: 19.4 },
  { month: 'Sep', value: 19.9 },
  { month: 'Oct', value: 19.5 },
  { month: 'Nov', value: 20.8 },
  { month: 'Dec', value: 21.0 },
  { month: 'Jan\n2026', value: 19.4 },
  { month: 'Feb', value: 19.5 },
  { month: 'Mar', value: 19.5 },
];

const SUMMARY_STATS = [
  { label: 'Total Investment', value: '₹13,03,225' },
  { label: 'Total Annual Payout', value: '₹2,29,448' },
  { label: 'Avg Monthly Interest', value: '1.5%–1.54%' },
];

export function GrowthChartSection() {
  return (
    <section id="investments" className="bg-white py-12 md:py-16">
      <div className="container-max">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 md:text-4xl">Track Your Growth</h2>
          <div className="mx-auto max-w-3xl">
            <p className="text-base font-bold tracking-wide text-primary md:text-lg">
              Fortune First &mdash; FY 2025-26
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Monthly Payout Overview &middot; April 2025 &ndash; March 2026
            </p>
          </div>
        </div>

        <div className="mx-auto mb-2 max-w-5xl">
          <div className="h-0.5 rounded-full bg-primary" />
        </div>

        <div className="mx-auto mb-0 h-[300px] w-full max-w-5xl rounded-2xl border border-gray-100 bg-muted p-4 md:h-[420px] md:p-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_PAYOUTS} margin={{ top: 28, right: 10, left: -10, bottom: 5 }} barCategoryGap="20%">
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${v}K`}
                domain={[0, 25]}
                ticks={[0, 5, 10, 15, 20, 25]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #f97316',
                  borderRadius: '8px',
                  color: '#1f2937',
                  fontSize: '12px',
                }}
                formatter={(value) => [`₹${value}K`, 'Monthly Payout'] as [string, string]}
                cursor={{ fill: 'rgba(249,115,22,0.08)' }}
              />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={45} fill="url(#barGradient)">
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(v) => `₹${v ?? ''}K`}
                  style={{ fill: '#92400e', fontSize: '9px', fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mx-auto mt-0 max-w-5xl rounded-b-2xl border border-t-0 border-gray-100 bg-muted px-4 py-5 md:px-6">
          <div className="grid grid-cols-1 gap-4 divide-y divide-orange-100 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {SUMMARY_STATS.map((stat) => (
              <div key={stat.label} className="py-2 sm:px-4 sm:py-0">
                <p className="mb-1 text-xs font-medium text-muted-foreground md:text-sm">{stat.label}</p>
                <p className="text-xl font-extrabold text-primary md:text-2xl">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-800 md:text-4xl">Past Returns</h2>
        </div>
      </div>
    </section>
  );
}

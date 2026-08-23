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

import type { PublicReturn } from '../lib/types';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface GrowthChartSectionProps {
  returns: PublicReturn[];
}

export function GrowthChartSection({ returns: rawReturns }: GrowthChartSectionProps) {
  // Postgres NUMERIC columns come back from the API as strings (a well-known
  // pg driver quirk), regardless of what the PublicReturn type declares —
  // normalize to real numbers before any arithmetic.
  const returns = rawReturns.map((r) => ({ ...r, return_pct: Number(r.return_pct) }));

  const chartData = returns.map((r) => ({
    month: `${MONTH_LABELS[r.month - 1]}\n${r.year}`,
    value: r.return_pct,
  }));

  const hasData = returns.length > 0;
  const avgReturn = hasData
    ? returns.reduce((sum, r) => sum + r.return_pct, 0) / returns.length
    : 0;
  const best = hasData
    ? returns.reduce((max, r) => (r.return_pct > max.return_pct ? r : max), returns[0])
    : null;
  const maxValue = hasData ? Math.max(...returns.map((r) => r.return_pct)) : 0;
  const yDomainMax = Math.ceil((maxValue + 0.5) * 2) / 2;

  const rangeLabel = hasData
    ? `${MONTH_LABELS[returns[0].month - 1]} ${returns[0].year} – ${MONTH_LABELS[returns[returns.length - 1].month - 1]} ${returns[returns.length - 1].year}`
    : null;

  return (
    <section id="investments" className="bg-background py-12 md:py-16">
      <div className="container-max">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground md:text-4xl">Track Your Growth</h2>
          <div className="mx-auto max-w-3xl">
            <p className="text-base font-bold tracking-wide text-primary md:text-lg">
              Fortune First &mdash; Monthly Returns
            </p>
            {rangeLabel && (
              <p className="mt-1 text-xs text-muted-foreground">
                Monthly Return Overview &middot; {rangeLabel}
              </p>
            )}
          </div>
        </div>

        <div className="mx-auto mb-2 max-w-5xl">
          <div className="h-0.5 rounded-full bg-primary" />
        </div>

        <div className="mx-auto mb-0 h-[300px] w-full max-w-5xl rounded-2xl border border-border bg-muted p-4 md:h-[420px] md:p-6">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 28, right: 10, left: -10, bottom: 5 }} barCategoryGap="20%">
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
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, yDomainMax]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f97316',
                    borderRadius: '8px',
                    color: '#1f2937',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value}%`, 'Monthly Return'] as [string, string]}
                  cursor={{ fill: 'rgba(249,115,22,0.08)' }}
                />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={45} fill="url(#barGradient)">
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v) => `${v ?? ''}%`}
                    style={{ fill: '#92400e', fontSize: '9px', fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Return history will appear here once published.
            </div>
          )}
        </div>

        {hasData && (
          <div className="mx-auto mt-0 max-w-5xl rounded-b-2xl border border-t-0 border-border bg-muted px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 divide-y divide-orange-100 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="py-2 sm:px-4 sm:py-0">
                <p className="mb-1 text-xs font-medium text-muted-foreground md:text-sm">Avg Monthly Return</p>
                <p className="text-xl font-extrabold text-primary md:text-2xl">{avgReturn.toFixed(2)}%</p>
              </div>
              <div className="py-2 sm:px-4 sm:py-0">
                <p className="mb-1 text-xs font-medium text-muted-foreground md:text-sm">Best Month</p>
                <p className="text-xl font-extrabold text-primary md:text-2xl">
                  {best ? `${MONTH_LABELS[best.month - 1]} ${best.year} — ${best.return_pct.toFixed(2)}%` : '—'}
                </p>
              </div>
              <div className="py-2 sm:px-4 sm:py-0">
                <p className="mb-1 text-xs font-medium text-muted-foreground md:text-sm">Months Tracked</p>
                <p className="text-xl font-extrabold text-primary md:text-2xl">{returns.length}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-foreground md:text-4xl">Past Returns</h2>
        </div>
      </div>
    </section>
  );
}

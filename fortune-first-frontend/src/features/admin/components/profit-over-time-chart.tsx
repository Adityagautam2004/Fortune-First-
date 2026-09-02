'use client';

import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

import type { MonthlyReport } from '@/features/reports/types';
import { useHorizontalChartScroll } from './use-horizontal-chart-scroll';

const MONTH_LABELS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const VISIBLE_MONTHS = 12;
const Y_AXIS_WIDTH = 70;

function formatRupees(value: number) {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
  return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
}

interface ProfitOverTimeChartProps {
  reports: MonthlyReport[];
}

// Sourced from the monthly reports admin/board enter by hand — replaces the
// old "Returns Over Time" placeholder now that this data actually exists.
// Loss months render as red bars, matching the red-for-loss convention used
// in the reports list/detail pages. The Y-axis pane is frozen (its own
// non-scrolling chart instance) while the plot area scrolls horizontally,
// showing the latest 12 months by default.
export function ProfitOverTimeChart({ reports }: ProfitOverTimeChartProps) {
  const chartData = useMemo(
    () =>
      [...reports]
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .map((r) => ({ label: `${MONTH_LABELS[r.month]} ${r.year}`, value: Number(r.total_profit) || 0 })),
    [reports]
  );

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const { containerRef, chartWidth } = useHorizontalChartScroll(chartData.length, VISIBLE_MONTHS);

  return (
    <div className="min-w-0 rounded-2xl border border-brand-border bg-card p-4">
      <div className="mb-0.5 flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">Profit Over Time</h3>
        <span
          className={`rounded-lg border border-brand-border px-2.5 py-1 text-xs font-semibold ${
            total < 0 ? 'text-red-600' : 'text-emerald-600'
          }`}
        >
          Total: {formatRupees(total)}
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Profit (₹) — scroll to see past months</p>

      {chartData.length === 0 ? (
        <div className="flex h-[260px] flex-col items-center justify-center gap-1 rounded-xl bg-brand-surface px-2 text-center">
          <BarChart3 size={20} className="shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No monthly reports added yet.</p>
        </div>
      ) : (
        <div className="flex h-[260px] w-full">
          <div style={{ width: Y_AXIS_WIDTH, height: '100%', flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 0, left: 4, bottom: 8 }}>
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatRupees(v)}
                  width={Y_AXIS_WIDTH}
                />
                <Bar dataKey="value" fill="transparent" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div ref={containerRef} className="min-w-0 flex-1 overflow-x-auto">
            <div style={{ width: chartWidth || '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--popover-foreground)',
                    }}
                    labelStyle={{ color: 'var(--popover-foreground)' }}
                    itemStyle={{ color: 'var(--popover-foreground)' }}
                    formatter={(value) => [formatRupees(Number(value)), 'Profit']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.value < 0 ? '#ef4444' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

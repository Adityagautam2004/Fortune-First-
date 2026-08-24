'use client';

import { useRef, useState } from 'react';
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
import { motion, useInView } from 'framer-motion';

import { AnimatedNumber } from '@/components/motion/animated-number';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import type { PublicReturn } from '../lib/types';
import { SliderField } from './slider-field';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatRupees(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// Simple interest projection over 1 year: SI = P × R × T, where R is the
// real average monthly return (annualized ×12) and T is fixed at 1 year —
// pure client-side math over the same avgReturn already computed for the chart.
function calculateSimpleInterest(principal: number, avgMonthlyReturnPct: number) {
  const annualRatePct = avgMonthlyReturnPct * 12;
  return (principal * annualRatePct) / 100;
}

interface GrowthChartSectionProps {
  returns: PublicReturn[];
}

export function GrowthChartSection({ returns: rawReturns }: GrowthChartSectionProps) {
  // Postgres NUMERIC columns come back from the API as strings (a well-known
  // pg driver quirk), regardless of what the PublicReturn type declares —
  // normalize to real numbers before any arithmetic.
  const returns = rawReturns.map((r) => ({ ...r, return_pct: Number(r.return_pct) }));
  const [calcAmount, setCalcAmount] = useState(50000);

  const chartData = returns.map((r) => ({
    month: `${MONTH_LABELS[r.month - 1]}\n${r.year}`,
    value: r.return_pct,
  }));

  const hasData = returns.length > 0;
  const avgReturn = hasData
    ? returns.reduce((sum, r) => sum + r.return_pct, 0) / returns.length
    : 0;
  const maxValue = hasData ? Math.max(...returns.map((r) => r.return_pct)) : 0;
  const yDomainMax = Math.ceil((maxValue + 0.5) * 2) / 2;

  const rangeLabel = hasData
    ? `${MONTH_LABELS[returns[0].month - 1]} ${returns[0].year} – ${MONTH_LABELS[returns[returns.length - 1].month - 1]} ${returns[returns.length - 1].year}`
    : null;

  const chartRef = useRef(null);
  const chartInView = useInView(chartRef, { once: true, amount: 0.3 });

  return (
    <section id="investments" className="bg-background py-12 md:py-16">
      <div className="container-max">
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
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
        </motion.div>

        <div className="mx-auto mb-2 max-w-5xl overflow-hidden">
          <motion.div
            className="h-0.5 rounded-full bg-primary"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ transformOrigin: 'left' }}
          />
        </div>

        <div
          ref={chartRef}
          className="mx-auto mb-0 h-[300px] w-full max-w-5xl rounded-2xl border border-border bg-muted p-4 md:h-[420px] md:p-6"
        >
          {hasData ? (
            chartInView && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 28, right: 10, left: -10, bottom: 5 }} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                      <stop offset="100%" stopColor="#fb923c" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, yDomainMax]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid #f97316',
                      borderRadius: '8px',
                      color: 'var(--popover-foreground)',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`${value}%`, 'Monthly Return'] as [string, string]}
                    cursor={{ fill: 'rgba(249,115,22,0.08)' }}
                    animationDuration={200}
                  />
                  <Bar
                    dataKey="value"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={45}
                    fill="url(#barGradient)"
                    animationDuration={1400}
                    animationEasing="ease-out"
                  >
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(v) => `${v ?? ''}%`}
                      style={{ fill: '#92400e', fontSize: '9px', fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Return history will appear here once published.
            </div>
          )}
        </div>

        {hasData && (
          <div className="mx-auto mt-0 max-w-5xl rounded-b-2xl border border-t-0 border-border bg-muted px-4 py-5 md:px-6">
            <StaggerGroup className="grid grid-cols-1 gap-4 divide-y divide-orange-100 text-center dark:divide-orange-500/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <StaggerItem className="py-2 text-left sm:px-4 sm:py-0">
                <SliderField
                  label="Investment Amount"
                  value={calcAmount}
                  onChange={setCalcAmount}
                  min={5000}
                  max={500000}
                  step={5000}
                  formatValue={formatRupees}
                />
              </StaggerItem>
              <StaggerItem className="py-2 sm:px-4 sm:py-0">
                <p className="mb-1 text-xs font-medium text-muted-foreground md:text-sm">Total Annual Return</p>
                {/* Plain text, not AnimatedNumber — this value tracks the slider live,
                    and AnimatedNumber only ever animates once (guarded by a ref), so it
                    would freeze after the first render instead of updating on drag. */}
                <p className="text-xl font-extrabold text-primary md:text-2xl">
                  {formatRupees(Math.round(calculateSimpleInterest(calcAmount, avgReturn)))}
                </p>
              </StaggerItem>
              <StaggerItem className="py-2 sm:px-4 sm:py-0">
                <p className="mb-1 text-xs font-medium text-muted-foreground md:text-sm">Average Annual Return</p>
                <p className="text-xl font-extrabold text-primary md:text-2xl">
                  <AnimatedNumber
                    value={avgReturn * 12}
                    start={chartInView}
                    format={(v) => `${v.toFixed(2)}%`}
                  />
                </p>
              </StaggerItem>
            </StaggerGroup>
          </div>
        )}

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-foreground md:text-4xl">Past Returns</h2>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useMemo, useState } from 'react';

import Modal from '@/components/ui/Modal';
import { calculateRetirement } from '../lib/calculate-retirement';
import { useDelayedChartReady } from '../hooks/use-delayed-chart-ready';
import { SliderField } from './slider-field';
import { BreakdownDonutChart } from './breakdown-donut-chart';

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface RetirementCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RetirementCalculatorModal({ isOpen, onClose }: RetirementCalculatorModalProps) {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [monthlyExpense, setMonthlyExpense] = useState(40000);
  const [inflationPct, setInflationPct] = useState(6);
  const [returnPct, setReturnPct] = useState(11);
  const chartReady = useDelayedChartReady(isOpen);

  const result = useMemo(
    () =>
      calculateRetirement(currentAge, retirementAge, lifeExpectancy, monthlyExpense, inflationPct, returnPct),
    [currentAge, retirementAge, lifeExpectancy, monthlyExpense, inflationPct, returnPct]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Retirement Calculator" size="xl">
      <p className="-mt-4 mb-5 text-sm text-muted-foreground">
        Plan your retirement corpus and secure your future.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <SliderField
            label="Current Age"
            value={currentAge}
            onChange={setCurrentAge}
            min={18}
            max={65}
            step={1}
            formatValue={(v) => `${v} yrs`}
          />
          <SliderField
            label="Retirement Age"
            value={retirementAge}
            onChange={setRetirementAge}
            min={40}
            max={75}
            step={1}
            formatValue={(v) => `${v} yrs`}
          />
          <SliderField
            label="Life Expectancy"
            value={lifeExpectancy}
            onChange={setLifeExpectancy}
            min={65}
            max={100}
            step={1}
            formatValue={(v) => `${v} yrs`}
          />
          <SliderField
            label="Monthly Expenses"
            value={monthlyExpense}
            onChange={setMonthlyExpense}
            min={5000}
            max={300000}
            step={1000}
            formatValue={formatRupees}
          />
          <SliderField
            label="Inflation Rate (p.a.)"
            value={inflationPct}
            onChange={setInflationPct}
            min={2}
            max={12}
            step={0.5}
            formatValue={(v) => `${v}%`}
          />
          <SliderField
            label="Expected Return (p.a.)"
            value={returnPct}
            onChange={setReturnPct}
            min={4}
            max={20}
            step={0.5}
            formatValue={(v) => `${v}%`}
          />
        </div>

        <BreakdownDonutChart
          ready={chartReady}
          segments={[
            { label: 'Your Contributions', value: result.totalContributions, color: '#111827' },
            { label: 'Growth', value: result.growthFromReturns, color: '#f97316' },
          ]}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-primary/15 bg-muted p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Years to Retirement</p>
          <p className="mt-1 text-lg font-extrabold text-foreground">{result.yearsToRetirement} yrs</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Future Monthly Expense</p>
          <p className="mt-1 text-lg font-extrabold text-foreground">{formatRupees(result.futureMonthlyExpense)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Retirement Corpus Required</p>
          <p className="mt-1 text-lg font-extrabold text-primary">{formatRupees(result.corpusRequired)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Monthly SIP Required</p>
          <p className="mt-1 text-lg font-extrabold text-foreground">{formatRupees(result.monthlySipRequired)}</p>
        </div>
      </div>
    </Modal>
  );
}

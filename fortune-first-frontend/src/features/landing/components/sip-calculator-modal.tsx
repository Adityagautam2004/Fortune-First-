'use client';

import { useMemo, useState } from 'react';

import Modal from '@/components/ui/Modal';
import { calculateSip } from '../lib/calculate-sip';
import { useDelayedChartReady } from '../hooks/use-delayed-chart-ready';
import { SliderField } from './slider-field';
import { BreakdownDonutChart } from './breakdown-donut-chart';

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface SipCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SipCalculatorModal({ isOpen, onClose }: SipCalculatorModalProps) {
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [annualRatePct, setAnnualRatePct] = useState(12);
  const [years, setYears] = useState(10);
  const chartReady = useDelayedChartReady(isOpen);

  const result = useMemo(
    () => calculateSip(monthlyInvestment, annualRatePct, years),
    [monthlyInvestment, annualRatePct, years]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SIP Calculator" size="lg">
      <p className="-mt-4 mb-5 text-sm text-gray-500">
        See how your monthly investments could grow over time.
      </p>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <SliderField
            label="Monthly Investment"
            value={monthlyInvestment}
            onChange={setMonthlyInvestment}
            min={500}
            max={100000}
            step={500}
            formatValue={formatRupees}
          />
          <SliderField
            label="Expected Return Rate (p.a.)"
            value={annualRatePct}
            onChange={setAnnualRatePct}
            min={1}
            max={30}
            step={0.5}
            formatValue={(v) => `${v}%`}
          />
          <SliderField
            label="Time Period"
            value={years}
            onChange={setYears}
            min={1}
            max={40}
            step={1}
            formatValue={(v) => `${v} ${v === 1 ? 'Year' : 'Years'}`}
          />
        </div>

        <BreakdownDonutChart
          ready={chartReady}
          segments={[
            { label: 'Invested', value: result.investedAmount, color: '#111827' },
            { label: 'Returns', value: result.estimatedReturns, color: '#f97316' },
          ]}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-primary/15 bg-muted p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-gray-500">Invested Amount</p>
          <p className="mt-1 text-lg font-extrabold text-gray-900">{formatRupees(result.investedAmount)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Est. Returns</p>
          <p className="mt-1 text-lg font-extrabold text-primary">{formatRupees(result.estimatedReturns)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Total Value</p>
          <p className="mt-1 text-lg font-extrabold text-gray-900">{formatRupees(result.totalValue)}</p>
        </div>
      </div>
    </Modal>
  );
}

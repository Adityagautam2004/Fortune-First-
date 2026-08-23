'use client';

import { useMemo, useState } from 'react';

import Modal from '@/components/ui/Modal';
import { calculateEmi } from '../lib/calculate-emi';
import { useDelayedChartReady } from '../hooks/use-delayed-chart-ready';
import { SliderField } from './slider-field';
import { BreakdownDonutChart } from './breakdown-donut-chart';

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface EmiCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmiCalculatorModal({ isOpen, onClose }: EmiCalculatorModalProps) {
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [annualRatePct, setAnnualRatePct] = useState(9);
  const [tenureYears, setTenureYears] = useState(15);
  const chartReady = useDelayedChartReady(isOpen);

  const result = useMemo(
    () => calculateEmi(loanAmount, annualRatePct, tenureYears),
    [loanAmount, annualRatePct, tenureYears]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="EMI Calculator" size="lg">
      <p className="-mt-4 mb-5 text-sm text-muted-foreground">
        Calculate your loan EMI and plan your monthly payments.
      </p>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <SliderField
            label="Loan Amount"
            value={loanAmount}
            onChange={setLoanAmount}
            min={50000}
            max={20000000}
            step={50000}
            formatValue={formatRupees}
          />
          <SliderField
            label="Interest Rate (p.a.)"
            value={annualRatePct}
            onChange={setAnnualRatePct}
            min={1}
            max={20}
            step={0.1}
            formatValue={(v) => `${v}%`}
          />
          <SliderField
            label="Loan Tenure"
            value={tenureYears}
            onChange={setTenureYears}
            min={1}
            max={30}
            step={1}
            formatValue={(v) => `${v} ${v === 1 ? 'Year' : 'Years'}`}
          />
        </div>

        <BreakdownDonutChart
          ready={chartReady}
          segments={[
            { label: 'Principal', value: result.principal, color: 'var(--muted-foreground)' },
            { label: 'Interest', value: result.totalInterest, color: '#f97316' },
          ]}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-primary/15 bg-muted p-5 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Monthly EMI</p>
          <p className="mt-1 text-lg font-extrabold text-primary">{formatRupees(result.emi)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Principal</p>
          <p className="mt-1 text-lg font-extrabold text-foreground">{formatRupees(result.principal)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total Interest</p>
          <p className="mt-1 text-lg font-extrabold text-foreground">{formatRupees(result.totalInterest)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total Payment</p>
          <p className="mt-1 text-lg font-extrabold text-foreground">{formatRupees(result.totalPayment)}</p>
        </div>
      </div>
    </Modal>
  );
}

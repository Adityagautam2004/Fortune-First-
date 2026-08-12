'use client';

import { useState } from 'react';

export default function Calculators() {
  const [sipAmount, setSipAmount] = useState(5000);
  const [sipYears, setSipYears] = useState(5);
  const [sipReturn, setSipReturn] = useState(12);

  // SIP Formula: M * [((1 + i)^n - 1) / i] * (1 + i) where i = rate/100/12, n = months
  const calculateSIP = () => {
    const monthlyRate = sipReturn / 100 / 12;
    const months = sipYears * 12;
    const futureValue = sipAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const invested = sipAmount * months;
    return { invested, futureValue: Math.round(futureValue) };
  };

  const { invested, futureValue } = calculateSIP();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-border">
      <h3 className="text-xl font-bold text-brand-navy mb-4">SIP Calculator</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Monthly Investment (₹{sipAmount})</label>
            <input type="range" min="1000" max="100000" step="1000" value={sipAmount} onChange={e => setSipAmount(Number(e.target.value))} className="w-full mt-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Time Period ({sipYears} Years)</label>
            <input type="range" min="1" max="30" value={sipYears} onChange={e => setSipYears(Number(e.target.value))} className="w-full mt-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Expected Return ({sipReturn}%)</label>
            <input type="range" min="5" max="30" value={sipReturn} onChange={e => setSipReturn(Number(e.target.value))} className="w-full mt-2" />
          </div>
        </div>
        <div className="flex flex-col justify-center items-center bg-brand-surface rounded-lg p-6">
          <p className="text-gray-600 mb-1">Total Invested: <span className="font-bold text-black">₹{invested.toLocaleString()}</span></p>
          <p className="text-gray-600 mb-2">Estimated Wealth:</p>
          <p className="text-4xl font-bold text-brand-orange">₹{futureValue.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
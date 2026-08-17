'use client';

import { useState } from 'react';
import { Calculator, PieChart, PiggyBank, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SipCalculatorModal } from './sip-calculator-modal';
import { EmiCalculatorModal } from './emi-calculator-modal';
import { RetirementCalculatorModal } from './retirement-calculator-modal';

type CalculatorKey = 'sip' | 'emi' | 'retirement';

const CALCULATORS: { key: CalculatorKey; title: string; description: string; icon: LucideIcon }[] = [
  {
    key: 'sip',
    title: 'SIP Calculator',
    description: 'Calculate future returns on your Systematic Investment Plan',
    icon: PieChart,
  },
  {
    key: 'emi',
    title: 'EMI Calculator',
    description: 'Calculate your loan EMI and plan your monthly payments.',
    icon: Calculator,
  },
  {
    key: 'retirement',
    title: 'Retirement Calculator',
    description: 'Plan your retirement corpus and secure your future.',
    icon: PiggyBank,
  },
];

export function CalculatorsSection() {
  const [openCalculator, setOpenCalculator] = useState<CalculatorKey | null>(null);

  return (
    <section id="calculators" className="bg-muted py-12 md:py-16">
      <div className="container-max">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-4xl">Financial Calculators</h2>
          <div className="mx-auto mb-3 h-1 w-16 rounded-full bg-primary" />
          <p className="mx-auto max-w-lg text-sm text-muted-foreground md:text-base">
            Plan better, Calculate smarter, Achieve your financial goals.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-3 md:gap-8 md:px-0">
          {CALCULATORS.map((calc) => (
            <Card
              key={calc.key}
              className="group flex flex-col items-center border-0 bg-white p-8 text-center shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted transition-transform duration-300 group-hover:scale-110 md:h-20 md:w-20">
                <calc.icon size={40} className="text-primary" />
              </div>

              <h3 className="mb-2 text-base font-bold text-gray-800 md:text-lg">{calc.title}</h3>
              <p className="mb-6 text-xs leading-relaxed text-muted-foreground md:text-sm">
                {calc.description}
              </p>

              <Button
                variant="outline"
                size="pill"
                className="mt-auto hover:bg-muted"
                onClick={() => setOpenCalculator(calc.key)}
              >
                Calculate
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <SipCalculatorModal isOpen={openCalculator === 'sip'} onClose={() => setOpenCalculator(null)} />
      <EmiCalculatorModal isOpen={openCalculator === 'emi'} onClose={() => setOpenCalculator(null)} />
      <RetirementCalculatorModal
        isOpen={openCalculator === 'retirement'}
        onClose={() => setOpenCalculator(null)}
      />
    </section>
  );
}

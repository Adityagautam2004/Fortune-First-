import { Calculator, PieChart, PiggyBank, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const CALCULATORS: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: 'SIP Calculator',
    description: 'Calculate future returns on your Systematic Investment Plan',
    icon: PieChart,
  },
  {
    title: 'EMI Calculator',
    description: 'Calculate your loan EMI and plan your monthly payments.',
    icon: Calculator,
  },
  {
    title: 'Retirement Calculator',
    description: 'Plan your retirement corpus and secure your future.',
    icon: PiggyBank,
  },
];

export function CalculatorsSection() {
  return (
    <section id="calculators" className="bg-white py-12 md:py-16">
      <div className="container-max">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-800 md:text-4xl">Financial Calculators</h2>
          <p className="mx-auto max-w-lg text-sm text-muted-foreground md:text-base">
            Plan better, Calculate smarter, Achieve your financial goals.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-3 md:gap-8 md:px-0">
          {CALCULATORS.map((calc) => (
            <Card
              key={calc.title}
              className="group flex flex-col items-center border-0 bg-muted p-8 text-center transition-shadow duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white transition-transform duration-300 group-hover:scale-110 md:h-20 md:w-20">
                <calc.icon size={40} className="text-primary" />
              </div>

              <h3 className="mb-2 text-base font-bold text-gray-800 md:text-lg">{calc.title}</h3>
              <p className="mb-6 text-xs leading-relaxed text-muted-foreground md:text-sm">
                {calc.description}
              </p>

              <Button variant="outline" size="pill" className="mt-auto hover:bg-white">
                Calculate
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

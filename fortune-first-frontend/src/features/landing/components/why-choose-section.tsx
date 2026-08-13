import { TrendingUp, ShieldCheck, MessageSquare, BadgePercent, type LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/Card';

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: TrendingUp,
    title: 'Easy Investments',
    description: 'Invest easily in top funds and stocks',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Platform',
    description: 'Your investments are safe and protected',
  },
  {
    icon: MessageSquare,
    title: 'Expert Advice',
    description: 'Get expert financial advice anytime',
  },
  {
    icon: BadgePercent,
    title: 'Low Fees',
    description: 'Maximize your returns with minimal fees',
  },
];

export function WhyChooseSection() {
  return (
    <section id="why-choose" className="bg-muted py-12 md:py-16">
      <div className="container-max">
        <div className="mb-10 text-center md:mb-14">
          <h2 className="text-2xl font-bold text-gray-800 md:text-4xl">Why Choose Fortune First?</h2>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 md:gap-8 md:px-0 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="flex flex-col items-center border-0 p-6 text-center transition-shadow duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] md:p-8"
            >
              <feature.icon size={32} strokeWidth={2} className="mb-4 text-primary" />
              <h3 className="mb-2 text-sm font-bold text-gray-800 md:text-base">{feature.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground md:text-sm">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

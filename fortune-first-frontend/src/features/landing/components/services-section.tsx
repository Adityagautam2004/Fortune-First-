import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const SERVICES = [
  {
    title: 'Investment Options',
    description: 'Invest through SIP or one-time payment',
    image: '/investmentoption_img.png',
  },
  {
    title: 'Fund Management',
    description: 'Manage and grow your wealth securely',
    image: '/FundManagement_img.png',
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-white pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container-max">
        <div className="mb-10 text-center md:mb-14">
          <h2 className="text-2xl font-bold text-gray-800 md:text-4xl">Our Services</h2>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 md:grid-cols-2 md:gap-16 md:px-0">
          {SERVICES.map((service) => (
            <div key={service.title} className="group flex cursor-pointer flex-col items-center">
              <Card className="mb-6 w-full overflow-hidden rounded-2xl border-0 bg-[#f5ebe0] p-0 shadow-[0_6px_24px_rgba(0,0,0,0.08)] transition-shadow duration-300 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
                <Image
                  src={service.image}
                  alt={service.title}
                  width={900}
                  height={600}
                  className="h-auto w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </Card>

              <div className="flex flex-col items-center px-4 text-center">
                <h3 className="mb-2 text-lg font-bold text-gray-800 md:text-xl">{service.title}</h3>
                <p className="mb-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <Button variant="outline" size="pill" className="gap-1.5">
                  Learn More
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

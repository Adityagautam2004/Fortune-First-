import { Star } from 'lucide-react';

import { Button } from '@/components/ui/Button';

export function TrustedSection() {
  return (
    <section id="trusted" className="border-t border-gray-100 bg-muted py-12 md:py-16">
      <div className="container-max text-center">
        <h2 className="mb-1 text-xl font-bold text-gray-800 md:text-2xl">
          Trusted by 20+ private clients
        </h2>
        <p className="mb-6 text-xs text-muted-foreground md:text-sm">
          Best financial platform for personal investments
        </p>

        <div className="mb-10 flex items-center justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={24} className="fill-primary text-primary" />
          ))}
        </div>

        <div className="mx-auto mb-8 h-px w-full max-w-4xl bg-gray-100" />

        <Button variant="default" size="sm" className="rounded-md">
          Terms &amp; Conditions
        </Button>
      </div>
    </section>
  );
}

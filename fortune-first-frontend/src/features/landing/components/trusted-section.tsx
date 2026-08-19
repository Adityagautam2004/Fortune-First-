import { Star, User, ChevronLeft, ChevronRight } from 'lucide-react';

import { Card } from '@/components/ui/Card';

const TESTIMONIALS: { quote: string; name: string; location: string; rating: number }[] = [
  {
    quote: "It's been a great way of save my money and grow safely.",
    name: 'Avinash Kumar',
    location: 'Client, Delhi',
    rating: 5,
  },
  {
    quote:
      'I am satisfied with my investment returns and having a great journey with fortune first.',
    name: 'Vrishabh Bansod',
    location: 'Client, Mumbai',
    rating: 5,
  },
  {
    quote: 'I am very satisfied after investing in this company.',
    name: 'Sharmishtha',
    location: 'Client, Kolkata',
    rating: 5,
  },
];

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

        <div className="relative mx-auto max-w-5xl px-4 md:px-0">
          <button
            type="button"
            aria-label="Previous testimonial"
            className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/30 bg-white text-primary shadow-sm transition-colors hover:bg-primary/10 md:flex"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <Card
                key={testimonial.name}
                className="flex flex-col items-start border-0 bg-white p-6 text-left shadow-[0_4px_20px_rgb(0,0,0,0.06)]"
              >
                <p className="mb-4 text-sm italic leading-relaxed text-gray-700">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="mb-5 flex items-center gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-primary text-primary" />
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-muted">
                    <User size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <button
            type="button"
            aria-label="Next testimonial"
            className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-primary/30 bg-white text-primary shadow-sm transition-colors hover:bg-primary/10 md:flex"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

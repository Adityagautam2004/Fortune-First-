'use client';

import { motion } from 'framer-motion';
import { Star, User } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import type { Testimonial } from '../lib/types';

interface TrustedSectionProps {
  testimonials: Testimonial[];
}

export function TrustedSection({ testimonials }: TrustedSectionProps) {
  return (
    <section id="trusted" className="border-t border-border bg-muted py-12 md:py-16">
      <div className="container-max text-center">
        <h2 className="mb-1 text-xl font-bold text-foreground md:text-2xl">
          Trusted by 20+ private clients
        </h2>
        <p className="mb-6 text-xs text-muted-foreground md:text-sm">
          Best financial platform for personal investments
        </p>

        <motion.div
          className="mb-10 flex items-center justify-center gap-1.5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.div
              key={star}
              variants={{
                hidden: { opacity: 0, scale: 0, rotate: -90 },
                visible: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 15 } },
              }}
            >
              <Star size={24} className="fill-primary text-primary" />
            </motion.div>
          ))}
        </motion.div>

        {testimonials.length === 0 ? (
          <p className="text-sm text-muted-foreground">Client testimonials coming soon.</p>
        ) : (
          <StaggerGroup className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-3 md:px-0">
            {testimonials.map((testimonial, i) => (
              <StaggerItem
                key={`${testimonial.client_name}-${i}`}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Card className="flex flex-col items-start border-0 bg-card p-6 text-left shadow-[0_4px_20px_rgb(0,0,0,0.06)]">
                  <p className="mb-4 text-sm italic leading-relaxed text-foreground">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  <div className="mb-5 flex items-center gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, starIdx) => (
                      <Star key={starIdx} size={16} className="fill-primary text-primary" />
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-muted">
                      <User size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{testimonial.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.city ? `Client, ${testimonial.city}` : 'Client'}
                      </p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}

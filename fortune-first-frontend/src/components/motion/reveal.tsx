'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number;
  as?: 'div' | 'section';
}

// Fade + slide-up wrapper for scroll-triggered entrances. Wraps a section's
// existing top-level element without touching its internal markup/classes —
// animates once when it first enters the viewport, then leaves it alone.
export function Reveal({ children, delay = 0, as = 'div', className, ...props }: RevealProps) {
  const MotionTag = as === 'section' ? motion.section : motion.div;

  return (
    <MotionTag
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

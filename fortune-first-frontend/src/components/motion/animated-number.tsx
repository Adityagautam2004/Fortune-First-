'use client';

import { useEffect, useRef } from 'react';
import { animate, useMotionValue, useTransform, motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  start?: boolean;
  duration?: number;
  className?: string;
}

// Counts up from 0 to `value` once `start` flips true (driven by the
// caller's own scroll-into-view check) rather than on every mount, so it
// doesn't fire off-screen and be already-finished by the time it's seen.
export function AnimatedNumber({ value, format, start = true, duration = 1.2, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (latest) => (format ? format(latest) : Math.round(latest).toString()));
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!start || hasStarted.current) return;
    hasStarted.current = true;
    const controls = animate(motionValue, value, { duration, ease: 'easeOut' });
    return () => controls.stop();
  }, [start, value, duration, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}

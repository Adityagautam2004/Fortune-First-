import { useEffect, useState } from 'react';

/**
 * recharts measures its container via ResizeObserver on mount; if that fires while a
 * parent modal's zoom-in animation is still transforming the DOM, it can latch onto a
 * stale/incorrect size. Delaying the chart's mount until just after the animation
 * settles avoids it. Reused by every calculator modal that renders a chart.
 */
export function useDelayedChartReady(isOpen: boolean, delayMs = 250): boolean {
  const [ready, setReady] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) setReady(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(timer);
  }, [isOpen, delayMs]);

  return ready;
}

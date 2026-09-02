'use client';

import { useLayoutEffect, useRef, useState } from 'react';

// Sizes a horizontally-scrollable chart pane so exactly `visiblePoints` data
// points fill the visible width (older points scroll off to the left), and
// keeps it scrolled all the way to the most recent data by default.
export function useHorizontalChartScroll(pointCount: number, visiblePoints = 12) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pointWidth = containerWidth > 0 ? containerWidth / visiblePoints : 0;
  const chartWidth = containerWidth > 0 ? Math.max(containerWidth, Math.round(pointWidth * pointCount)) : 0;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [chartWidth, pointCount]);

  return { containerRef, chartWidth };
}

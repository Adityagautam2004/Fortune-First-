'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

// Scoped to the landing page only (mounted here, not in the root layout) —
// the internal admin/board/dashboard shells have their own fixed sidebars
// and internally-scrolling panels that a momentum-scroll library like Lenis
// is known to fight with, so this deliberately never reaches those routes.
export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });

    let frameId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

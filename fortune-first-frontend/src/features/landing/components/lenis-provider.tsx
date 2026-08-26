'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Lenis from 'lenis';

const LenisContext = createContext<Lenis | null>(null);

// Anything that scrolls the page programmatically (nav links, "back to top"
// buttons, etc.) must go through this instead of the native
// element.scrollIntoView()/window.scrollTo() — Lenis owns the actual scroll
// position via its own raf loop and will just fight a native scroll call,
// snapping back to its last known position on the very next frame.
export function useLenis() {
  return useContext(LenisContext);
}

// Scoped to the landing page only (mounted here, not in the root layout) —
// the internal admin/board/dashboard shells have their own fixed sidebars
// and internally-scrolling panels that a momentum-scroll library like Lenis
// is known to fight with, so this deliberately never reaches those routes.
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const instance = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });
    setLenis(instance);

    let frameId: number;
    const raf = (time: number) => {
      instance.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

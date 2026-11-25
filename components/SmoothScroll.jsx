'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

// Buttery scrolling. Skipped for people who ask their OS for reduced motion.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.09 });
    window.__lenis = lenis;
    let id;
    const loop = (t) => {
      lenis.raf(t);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
  return null;
}

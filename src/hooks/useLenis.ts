import { useEffect } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from './useReducedMotion';

let lenisInstance: Lenis | null = null;

export function useLenis() {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      lenisInstance?.destroy();
      lenisInstance = null;
      return;
    }

    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.5,
    });

    let frameId: number;

    function raf(time: number) {
      lenisInstance?.raf(time);
      frameId = requestAnimationFrame(raf);
    }

    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, [reduced]);

  return lenisInstance;
}

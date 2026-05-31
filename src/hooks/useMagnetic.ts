import React, { useRef, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function useMagnetic(strength: number = 0.3) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const reduced = useReducedMotion();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current.style.setProperty('--magnetic-x', `${x * strength}px`);
    ref.current.style.setProperty('--magnetic-y', `${y * strength}px`);
  }, [strength, reduced]);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.setProperty('--magnetic-x', '0px');
    ref.current.style.setProperty('--magnetic-y', '0px');
  }, []);

  return { ref, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave };
}

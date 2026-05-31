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
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  }, [strength, reduced]);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'translate(0px, 0px)';
    ref.current.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => {
      if (ref.current) ref.current.style.transition = '';
    }, 400);
  }, []);

  return { ref, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave };
}

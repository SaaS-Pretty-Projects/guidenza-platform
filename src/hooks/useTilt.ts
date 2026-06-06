import React, { useRef, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';

export function useTilt(maxDeg: number = 6) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateY(${x * maxDeg}deg) rotateX(${-y * maxDeg}deg) scale3d(1.02, 1.02, 1.02)`;
  }, [maxDeg, reduced]);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
    ref.current.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => {
      if (ref.current) ref.current.style.transition = '';
    }, 500);
  }, []);

  return { ref, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave };
}

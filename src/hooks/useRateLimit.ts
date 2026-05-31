import { useCallback } from 'react';

interface RateLimitConfig {
  key: string;
  maxPerDay: number;
}

function getTodayKey(key: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `guidenza_rl_${key}_${today}`;
}

export function useRateLimit({ key, maxPerDay }: RateLimitConfig) {
  const getCount = useCallback((): number => {
    const stored = localStorage.getItem(getTodayKey(key));
    return stored ? parseInt(stored, 10) : 0;
  }, [key]);

  const remaining = useCallback((): number => {
    return Math.max(0, maxPerDay - getCount());
  }, [getCount, maxPerDay]);

  const isAllowed = useCallback((): boolean => {
    return getCount() < maxPerDay;
  }, [getCount, maxPerDay]);

  const consume = useCallback((): boolean => {
    const count = getCount();
    if (count >= maxPerDay) return false;
    localStorage.setItem(getTodayKey(key), String(count + 1));
    return true;
  }, [key, getCount, maxPerDay]);

  return { isAllowed, consume, remaining, used: getCount };
}

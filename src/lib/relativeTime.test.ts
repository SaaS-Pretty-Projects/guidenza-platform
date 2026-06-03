import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { relativeTime } from './relativeTime';

describe('relativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-31T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for <60s ago', () => {
    const d = new Date('2026-05-31T11:59:30Z');
    expect(relativeTime(d)).toBe('just now');
  });

  it('returns "Xm ago" for <60min ago', () => {
    const d = new Date('2026-05-31T11:30:00Z');
    expect(relativeTime(d)).toBe('30m ago');
  });

  it('returns "Xh ago" for <24h ago', () => {
    const d = new Date('2026-05-31T09:00:00Z');
    expect(relativeTime(d)).toBe('3h ago');
  });

  it('returns "Yesterday" for exactly 1 day ago', () => {
    const d = new Date('2026-05-30T12:00:00Z');
    expect(relativeTime(d)).toBe('Yesterday');
  });

  it('returns short date for same year', () => {
    const d = new Date('2026-01-15T12:00:00Z');
    expect(relativeTime(d)).toBe('Jan 15');
  });

  it('returns date with year for different year', () => {
    const d = new Date('2025-01-15T12:00:00Z');
    expect(relativeTime(d)).toBe('Jan 15, 2025');
  });
});

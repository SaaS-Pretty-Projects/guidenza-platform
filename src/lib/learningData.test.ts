import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getWeekDots } from './learningData';

// Week: Mon 2026-05-25 through Sun 2026-05-31
// System time pinned to Sunday 2026-05-31 10:00 UTC
describe('getWeekDots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-31T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks days with activity as active', () => {
    const activityDates = ['2026-05-25', '2026-05-27', '2026-05-31'];
    const dots = getWeekDots(activityDates);
    expect(dots[0]).toBe('active'); // Mon 25
    expect(dots[1]).toBe('empty');  // Tue 26
    expect(dots[2]).toBe('active'); // Wed 27
    expect(dots[3]).toBe('empty');  // Thu 28
    expect(dots[4]).toBe('empty');  // Fri 29
    expect(dots[5]).toBe('empty');  // Sat 30
    expect(dots[6]).toBe('active'); // Sun 31 (today, with activity)
  });

  it('marks today as "today" when no activity yet', () => {
    const activityDates: string[] = [];
    const dots = getWeekDots(activityDates);
    expect(dots[6]).toBe('today'); // Sunday = today, no activity
  });

  it('marks future days as empty', () => {
    vi.setSystemTime(new Date('2026-05-27T10:00:00Z')); // Wednesday
    const activityDates: string[] = [];
    const dots = getWeekDots(activityDates);
    expect(dots[3]).toBe('empty'); // Thursday — future
    expect(dots[4]).toBe('empty'); // Friday — future
  });

  it('returns exactly 7 dots', () => {
    expect(getWeekDots([])).toHaveLength(7);
  });
});

import { describe, expect, it } from 'vitest';
import { hasCourseAccess } from './orders';

describe('hasCourseAccess', () => {
  it('allows courses in purchasedCourses', () => {
    expect(hasCourseAccess({ purchasedCourses: ['course-1'] }, 'course-1')).toBe(true);
  });

  it('keeps existing enrolled users compatible', () => {
    expect(hasCourseAccess({ enrolledCourses: ['course-1'] }, 'course-1')).toBe(true);
  });

  it('denies missing courses and missing user data', () => {
    expect(hasCourseAccess({ purchasedCourses: ['course-2'] }, 'course-1')).toBe(false);
    expect(hasCourseAccess(undefined, 'course-1')).toBe(false);
  });
});

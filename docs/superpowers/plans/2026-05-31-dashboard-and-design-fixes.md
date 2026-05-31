# Dashboard & Design Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 design inconsistencies across the landing/inner pages and build a fully-functional student dashboard backed by real Firestore data (streak tracking, per-module progress, certificates, activity feed).

**Architecture:** Design fixes are surgical one-file edits. The dashboard introduces three new modules — `src/lib/learningData.ts` (all Firestore writes/reads for the learning data model), `src/hooks/useDashboard.ts` (aggregates data for the dashboard UI), and `src/lib/relativeTime.ts` (pure time helper). `Dashboard.tsx` is a full rewrite. `CoursePreview.tsx` gains a module checklist that drives all data writes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Framer Motion, Firebase Firestore v12, Lucide React, react-hot-toast, Vitest (added in Task 4).

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/CTA.tsx` | Modify | Fix `rounded-lg` → `rounded-full` on buttons |
| `src/components/Solution.tsx` | Modify | Fix `hover:bg-white-[0.03]` typo |
| `src/components/Explore.tsx` | Modify | Fix hover typo + add overline + serif heading |
| `src/components/SearchChanged.tsx` | Modify | Fix tablet padding breakpoint |
| `src/components/Footer.tsx` | Modify | Fix 3-col grid responsiveness |
| `src/components/Navbar.tsx` | Modify | Add `SearchBar` to mobile menu |
| `src/components/CoursePreview.tsx` | Modify | Fix mobile scroll, migrate enrollment to `enrolledCourses`, add module checklist |
| `src/lib/relativeTime.ts` | Create | Pure function: date → "2h ago" / "Yesterday" / "Jan 15" |
| `src/lib/relativeTime.test.ts` | Create | Vitest unit tests for relativeTime |
| `src/lib/learningData.ts` | Create | All Firestore helpers: recordCourseOpen, markModuleComplete, enrollInCourse, getProgressForCourse, getRecentActivity, getCertificates, getWeekDots |
| `src/lib/learningData.test.ts` | Create | Vitest unit tests for getWeekDots (pure function) |
| `src/lib/seeder.ts` | Modify | Add `modules` array to each course |
| `src/hooks/useDashboard.ts` | Create | Fetches userData + inProgress courses + activity + certificates |
| `src/components/Dashboard.tsx` | Rewrite | New learner hub UI |
| `firestore.rules` | Modify | Allow read/write on `users/{uid}` subcollections |
| `vite.config.ts` | Modify | Add vitest config block |
| `package.json` | Modify | Add vitest dev dependency + test script |

---

## Task 1 — Design fixes: button shapes, hover typos, tablet padding

**Files:**
- Modify: `src/components/CTA.tsx`
- Modify: `src/components/Solution.tsx`
- Modify: `src/components/Explore.tsx`
- Modify: `src/components/SearchChanged.tsx`

- [ ] **Step 1: Fix CTA button shapes**

In `src/components/CTA.tsx`, find the two `<motion.button>` elements inside the content div. Change `rounded-lg` to `rounded-full` on both:

```tsx
// Before (two buttons):
className="bg-foreground text-background rounded-lg px-8 py-3.5 ..."
className="liquid-glass border border-white/10 rounded-lg px-8 py-3.5 ..."

// After:
className="bg-foreground text-background rounded-full px-8 py-3.5 text-sm font-semibold w-full sm:w-auto"
className="liquid-glass border border-white/10 rounded-full px-8 py-3.5 text-sm font-semibold w-full sm:w-auto"
```

- [ ] **Step 2: Fix hover class typo in Solution.tsx**

In `src/components/Solution.tsx`, find the `motion.div` card for each course:

```tsx
// Before:
className="... hover:bg-white-[0.03] ..."

// After:
className="... hover:bg-white/[0.03] ..."
```

- [ ] **Step 3: Fix hover class typo + typography in Explore.tsx**

In `src/components/Explore.tsx`, two changes:

**3a** — Fix hover typo on the course card `div`:
```tsx
// Before:
className="liquid-glass rounded-3xl border border-white/5 overflow-hidden group cursor-pointer hover:bg-white-[0.03] transition-colors"

// After:
className="liquid-glass rounded-3xl border border-white/5 overflow-hidden group cursor-pointer hover:bg-white/[0.03] transition-colors"
```

**3b** — Replace the plain heading with the branded pattern. Find:
```tsx
<h1 className="text-4xl font-semibold mb-8 tracking-[-0.5px]">Explore Courses</h1>
```
Replace with:
```tsx
<div className="mb-16">
  <div className="text-xs uppercase tracking-[3px] text-muted-foreground mb-4">
    Explore Courses
  </div>
  <h1 className="text-4xl md:text-5xl font-medium tracking-[-1px]">
    Find your next{' '}
    <span className="font-serif italic font-normal">expertise</span>
  </h1>
</div>
```
Remove the old `mb-8` from the heading wrapper and adjust the category filter `mb-12` to `mb-8` since the heading block now has `mb-16`.

- [ ] **Step 4: Fix SearchChanged tablet padding**

In `src/components/SearchChanged.tsx`, find the outer `<section>` element:
```tsx
// Before:
className="pt-52 md:pt-64 pb-20 px-6 md:px-8 max-w-7xl mx-auto"

// After:
className="pt-40 md:pt-52 lg:pt-64 pb-20 px-6 md:px-8 max-w-7xl mx-auto"
```

- [ ] **Step 5: Run the dev server and visually verify the four changes**

```bash
npm run dev
```

Check at `http://localhost:5173`:
- CTA section: both buttons are pill-shaped (rounded-full)
- Solution course cards: hover shows a subtle background tint
- Explore page: new serif heading visible, course card hover works
- Landing page: scroll past the hero — the "Education has evolved" section should have a more gradual top gap at medium screen widths

Stop the server with `Ctrl+C`.

- [ ] **Step 6: Commit**

```bash
git add src/components/CTA.tsx src/components/Solution.tsx src/components/Explore.tsx src/components/SearchChanged.tsx
git commit -m "fix: design consistency — button shapes, hover classes, explore typography, tablet padding"
```

---

## Task 2 — Design fixes: footer grid + mobile navbar search

**Files:**
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Fix footer link column grid**

In `src/components/Footer.tsx`, find the links grid div (the one containing the 3 `FOOTER_LINKS` columns):
```tsx
// Before:
className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8"

// After:
className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
```

- [ ] **Step 2: Add SearchBar to mobile menu**

In `src/components/Navbar.tsx`, the `AnimatePresence` mobile menu block already has nav links and social icons. Add `SearchBar` right before the social icons `motion.div`:

First, confirm `SearchBar` is already imported at the top of the file — it is (`import { SearchBar } from './SearchBar';`).

Find this block inside the mobile menu's `motion.div`:
```tsx
<motion.div variants={itemVariants} className="flex items-center gap-4 pt-4 border-t border-border/30">
  {[Instagram, Linkedin, Twitter].map((Icon, i) => (
```

Insert a new `motion.div` immediately before it:
```tsx
<motion.div variants={itemVariants} className="pt-2">
  <SearchBar />
</motion.div>
<motion.div variants={itemVariants} className="flex items-center gap-4 pt-4 border-t border-border/30">
  {[Instagram, Linkedin, Twitter].map((Icon, i) => (
```

- [ ] **Step 3: Run dev server and check**

```bash
npm run dev
```

- Footer: at ~600–900px viewport width, the three link columns should stack to 1 col on very narrow, then 2 col at `sm`, then 3 col at `lg`. No orphaned column.
- Navbar: tap the hamburger on a narrow viewport — the mobile menu should show a search bar above the social icons.

Stop with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.tsx src/components/Navbar.tsx
git commit -m "fix: footer responsive grid and mobile navbar search bar"
```

---

## Task 3 — Design fix: CoursePreview mobile scroll

**Files:**
- Modify: `src/components/CoursePreview.tsx`

- [ ] **Step 1: Fix modal scroll container**

In `src/components/CoursePreview.tsx`, find the inner `motion.div` (the white modal box). It currently has:
```tsx
className="bg-background border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl custom-scrollbar"
```

Change `max-h-[90vh]` to `max-h-[85dvh]` so it uses the dynamic viewport height on mobile:
```tsx
className="bg-background border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85dvh] overflow-y-auto relative shadow-2xl custom-scrollbar"
```

- [ ] **Step 2: Make the enroll/action buttons sticky on mobile**

Find the `<div className="flex flex-col sm:flex-row items-center gap-4 mb-12">` that wraps the enroll/continue buttons. Wrap it in a sticky footer:

```tsx
// Before:
<div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
  {!isEnrolled ? (
    ...
  ) : (
    ...
  )}
</div>

// After:
<div className="sticky bottom-0 -mx-8 px-8 py-4 bg-background/95 backdrop-blur-sm border-t border-white/5 flex flex-col sm:flex-row items-center gap-4 mb-0 mt-4 z-10">
  {!isEnrolled ? (
    ...
  ) : (
    ...
  )}
</div>
```

- [ ] **Step 3: Verify on narrow viewport**

```bash
npm run dev
```

Open `http://localhost:5173`, click any course card to open the preview modal. On a narrow screen (or using DevTools to emulate 375px width), the modal should be scrollable and the enroll/continue button should be pinned to the bottom while the description scrolls.

Stop with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add src/components/CoursePreview.tsx
git commit -m "fix: CoursePreview modal scroll on mobile with sticky action bar"
```

---

## Task 4 — Vitest setup + relativeTime utility

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/lib/relativeTime.ts`
- Create: `src/lib/relativeTime.test.ts`

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Add test script to package.json**

In `package.json`, add to the `"scripts"` block:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Add vitest config to vite.config.ts**

In `vite.config.ts`, add a `test` block inside the returned config object:
```typescript
// Full file after change:
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      environment: 'node',
    },
  };
});
```

- [ ] **Step 4: Write the failing test for relativeTime**

Create `src/lib/relativeTime.test.ts`:
```typescript
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
```

- [ ] **Step 5: Run the test to verify it fails**

```bash
npm test
```

Expected output: `FAIL src/lib/relativeTime.test.ts — Cannot find module './relativeTime'`

- [ ] **Step 6: Create relativeTime.ts**

Create `src/lib/relativeTime.ts`:
```typescript
export function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  if (date >= yesterdayStart && date < todayStart) return 'Yesterday';

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
```

- [ ] **Step 7: Run tests and verify they pass**

```bash
npm test
```

Expected output:
```
✓ src/lib/relativeTime.test.ts (6)
Test Files  1 passed (1)
Tests  6 passed (6)
```

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.ts src/lib/relativeTime.ts src/lib/relativeTime.test.ts
git commit -m "feat: add vitest and relativeTime utility"
```

---

## Task 5 — learningData.ts — Firestore helpers + Firestore rules

**Files:**
- Create: `src/lib/learningData.ts`
- Create: `src/lib/learningData.test.ts`
- Modify: `firestore.rules`

- [ ] **Step 1: Write failing tests for getWeekDots (pure function)**

Create `src/lib/learningData.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getWeekDots } from './learningData';

// Monday 2026-05-25 through Sunday 2026-05-31
// System time: Sunday 2026-05-31 (today)
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
```

- [ ] **Step 2: Run tests to see them fail**

```bash
npm test
```

Expected: `FAIL src/lib/learningData.test.ts — Cannot find module './learningData'`

- [ ] **Step 3: Create learningData.ts**

Create `src/lib/learningData.ts`:
```typescript
import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, arrayUnion, increment,
  serverTimestamp, Timestamp, query,
  orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CourseModule {
  id: string;
  title: string;
}

export interface CourseProgress {
  completedModules: string[];
  totalModules: number;
  lastModuleId: string;
  updatedAt: Timestamp | null;
}

export interface ActivityEvent {
  id: string;
  type: 'module_complete' | 'enrolled' | 'certificate_earned';
  courseId: string;
  courseName: string;
  moduleId?: string;
  moduleName?: string;
  createdAt: { toDate(): Date } | Date;
}

export interface Certificate {
  courseId: string;
  courseName: string;
  issuedAt: Timestamp;
}

// ── Pure helpers (testable without Firestore) ──────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function weekStartISO(): string {
  const d = new Date();
  const dow = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

/**
 * Returns 7 dot states for Mon–Sun of the current week.
 * activityDates: ISO date strings ("2026-05-28") from the activity log.
 */
export function getWeekDots(
  activityDates: string[],
): Array<'active' | 'today' | 'empty'> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const activeSet = new Set(activityDates);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    if (iso > todayStr) return 'empty';
    if (activeSet.has(iso)) return 'active';
    if (iso === todayStr) return 'today';
    return 'empty';
  });
}

// ── Firestore writes ────────────────────────────────────────────────────────

/**
 * Called when an enrolled user opens CoursePreview.
 * Updates lastActiveDate and streak — does NOT add time (no work done yet).
 */
export async function recordCourseOpen(uid: string): Promise<void> {
  const today = todayISO();
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data() as Record<string, unknown>;
  const lastActive = (data.lastActiveDate as string) ?? '';
  if (lastActive === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const currentStreak = (data.streakCount as number) ?? 0;
  const newStreak = lastActive === yesterdayStr ? currentStreak + 1 : 1;
  const longestStreak = Math.max((data.longestStreak as number) ?? 0, newStreak);

  await updateDoc(userRef, { lastActiveDate: today, streakCount: newStreak, longestStreak });
}

/**
 * Records that a user clicked "Mark done" on a module.
 * Writes progress, time, activity event, and certificate if course complete.
 * Returns whether a certificate was just earned.
 */
export async function markModuleComplete(
  uid: string,
  courseId: string,
  moduleId: string,
  moduleName: string,
  courseName: string,
  totalModules: number,
): Promise<{ certificateEarned: boolean }> {
  const weekStart = weekStartISO();
  const progressRef = doc(db, 'users', uid, 'progress', courseId);
  const userRef = doc(db, 'users', uid);

  // Read current progress
  const progressSnap = await getDoc(progressRef);
  const existing: CourseProgress = progressSnap.exists()
    ? (progressSnap.data() as CourseProgress)
    : { completedModules: [], totalModules, lastModuleId: '', updatedAt: null };

  if (existing.completedModules.includes(moduleId)) {
    return { certificateEarned: false };
  }

  // Update progress subcollection
  await setDoc(
    progressRef,
    {
      completedModules: arrayUnion(moduleId),
      totalModules,
      lastModuleId: moduleId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  // Update user time fields (with weekly reset logic)
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? (userSnap.data() as Record<string, unknown>) : {};
  const storedWeekStart = (userData.weeklySecondsUpdatedAt as string) ?? '';

  const timeUpdate: Record<string, unknown> = {
    totalLearningSeconds: increment(1200),
  };
  if (storedWeekStart !== weekStart) {
    timeUpdate.prevWeeklySeconds = (userData.weeklySeconds as number) ?? 0;
    timeUpdate.weeklySeconds = 1200;
    timeUpdate.weeklySecondsUpdatedAt = weekStart;
  } else {
    timeUpdate.weeklySeconds = increment(1200);
  }
  await updateDoc(userRef, timeUpdate);

  // Append activity event
  await addDoc(collection(db, 'users', uid, 'activity'), {
    type: 'module_complete',
    courseId,
    courseName,
    moduleId,
    moduleName,
    createdAt: serverTimestamp(),
  });

  // Issue certificate if all modules done
  const newCount = existing.completedModules.length + 1;
  if (newCount >= totalModules) {
    await setDoc(doc(db, 'users', uid, 'certificates', courseId), {
      courseName,
      issuedAt: serverTimestamp(),
    });
    await addDoc(collection(db, 'users', uid, 'activity'), {
      type: 'certificate_earned',
      courseId,
      courseName,
      createdAt: serverTimestamp(),
    });
    return { certificateEarned: true };
  }

  return { certificateEarned: false };
}

/**
 * Enrolls a user in a course and appends an activity event.
 */
export async function enrollInCourse(
  uid: string,
  courseId: string,
  courseName: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    enrolledCourses: arrayUnion(courseId),
  }).catch(async (e) => {
    if (e.code === 'not-found') {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', uid), {
        enrolledCourses: [courseId],
        savedCourses: [],
        wishlist: [],
      });
    } else {
      throw e;
    }
  });

  await addDoc(collection(db, 'users', uid, 'activity'), {
    type: 'enrolled',
    courseId,
    courseName,
    createdAt: serverTimestamp(),
  });
}

// ── Firestore reads ─────────────────────────────────────────────────────────

export async function getProgressForCourse(
  uid: string,
  courseId: string,
): Promise<CourseProgress | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'progress', courseId));
  return snap.exists() ? (snap.data() as CourseProgress) : null;
}

export async function getRecentActivity(uid: string): Promise<ActivityEvent[]> {
  const q = query(
    collection(db, 'users', uid, 'activity'),
    orderBy('createdAt', 'desc'),
    limit(10),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityEvent));
}

export async function getCertificates(uid: string): Promise<Certificate[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'certificates'));
  return snap.docs.map((d) => ({ courseId: d.id, ...d.data() } as Certificate));
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected output:
```
✓ src/lib/relativeTime.test.ts (6)
✓ src/lib/learningData.test.ts (4)
Test Files  2 passed (2)
Tests  10 passed (10)
```

- [ ] **Step 5: Update Firestore rules to allow user subcollections**

Replace the content of `firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /subscriptions/{subscriptionId} {
      allow create: if true;
      allow read, update, delete: if false;
    }
    match /courses/{courseId} {
      allow read, write: if true;
      match /reviews/{reviewId} {
        allow read, write: if true;
      }
      match /announcements/{announcementId} {
        allow read, write: if true;
      }
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{subcollection=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 6: Deploy Firestore rules**

```bash
firebase deploy --only firestore:rules
```

Expected: `✔  firestore: released rules`

- [ ] **Step 7: Commit**

```bash
git add src/lib/learningData.ts src/lib/learningData.test.ts firestore.rules
git commit -m "feat: learningData Firestore helpers and Firestore rules for subcollections"
```

---

## Task 6 — Update seeder with modules arrays

**Files:**
- Modify: `src/lib/seeder.ts`

- [ ] **Step 1: Add modules arrays to each course**

Replace the contents of `src/lib/seeder.ts`:
```typescript
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const SAMPLE_COURSES = [
  {
    title: "Advanced React Patterns",
    author: "Elena Rodriguez",
    description: "Master modern React architecture, custom hooks, and performance optimization techniques for large-scale applications.",
    price: 199,
    thumbnail: "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    categories: ["Development", "React", "Frontend"],
    totalModules: 8,
    modules: [
      { id: 'mod-1', title: 'Introduction & Project Setup' },
      { id: 'mod-2', title: 'Component Composition Patterns' },
      { id: 'mod-3', title: 'Custom Hooks in Depth' },
      { id: 'mod-4', title: 'Context & State Architecture' },
      { id: 'mod-5', title: 'Performance Optimization' },
      { id: 'mod-6', title: 'Testing React Components' },
      { id: 'mod-7', title: 'Code Splitting & Lazy Loading' },
      { id: 'mod-8', title: 'Capstone: Refactor a Real App' },
    ],
  },
  {
    title: "System Design Interview Prep",
    author: "Michael Chen",
    description: "A comprehensive guide to backend system design, scaling, and architectural choices for FAANG interviews.",
    price: 149,
    thumbnail: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    categories: ["Development", "Architecture", "Career"],
    totalModules: 8,
    modules: [
      { id: 'mod-1', title: 'System Design Fundamentals' },
      { id: 'mod-2', title: 'Scaling & Load Balancing' },
      { id: 'mod-3', title: 'Database Design & Sharding' },
      { id: 'mod-4', title: 'Caching Strategies' },
      { id: 'mod-5', title: 'Message Queues & Async Systems' },
      { id: 'mod-6', title: 'Microservices vs Monoliths' },
      { id: 'mod-7', title: 'Real-World Case Studies' },
      { id: 'mod-8', title: 'Mock Interview Walkthroughs' },
    ],
  },
  {
    title: "The Indie Founder Playbook",
    author: "Sarah Jenks",
    description: "From idea to revenue: how to build, launch, and scale a profitable micro-SaaS as a solo developer.",
    price: 99,
    thumbnail: "https://images.pexels.com/photos/3194521/pexels-photo-3194521.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    categories: ["Business", "Startups", "Entrepreneurship"],
    totalModules: 8,
    modules: [
      { id: 'mod-1', title: 'Finding a Profitable Niche' },
      { id: 'mod-2', title: 'Validating Before You Build' },
      { id: 'mod-3', title: 'MVP in a Weekend' },
      { id: 'mod-4', title: 'Landing Page & Early Access' },
      { id: 'mod-5', title: 'Pricing Strategy' },
      { id: 'mod-6', title: 'Distribution & Marketing' },
      { id: 'mod-7', title: 'Customer Support at Scale' },
      { id: 'mod-8', title: 'From $1K to $10K MRR' },
    ],
  },
  {
    title: "Machine Learning with Python",
    author: "Dr. Alex Rivera",
    description: "Practical ML from scratch. Build intelligent features and dive deep into standard algorithms using Python.",
    price: 249,
    thumbnail: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    categories: ["Development", "Data Science", "Python"],
    totalModules: 8,
    modules: [
      { id: 'mod-1', title: 'Python for Data Science' },
      { id: 'mod-2', title: 'NumPy & Pandas Essentials' },
      { id: 'mod-3', title: 'Supervised Learning Algorithms' },
      { id: 'mod-4', title: 'Model Evaluation & Tuning' },
      { id: 'mod-5', title: 'Unsupervised Learning' },
      { id: 'mod-6', title: 'Neural Networks from Scratch' },
      { id: 'mod-7', title: 'Feature Engineering in Practice' },
      { id: 'mod-8', title: 'Deploying ML Models' },
    ],
  },
];

export async function seedCoursesIfEmpty() {
  try {
    const q = collection(db, 'courses');
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log('Seeding courses...');
      for (const course of SAMPLE_COURSES) {
        await addDoc(collection(db, 'courses'), course);
      }
      console.log('Courses seeded successfully!');
    }
  } catch (err) {
    console.error('Failed to seed courses:', err);
  }
}
```

Note: `totalModules` reduced from 12/15/8/20 to 8 across all courses. This normalizes the data — the module list is now the source of truth.

- [ ] **Step 2: Commit**

```bash
git add src/lib/seeder.ts
git commit -m "feat: add modules array to seeded courses"
```

---

## Task 7 — Update CoursePreview enrollment to use enrolledCourses

**Files:**
- Modify: `src/components/CoursePreview.tsx`

The existing `CoursePreview` uses `savedCourses` for enrollment. This task migrates the enrollment check and write to `enrolledCourses` (per the new data model) while keeping `savedCourses` intact for wishlist.

- [ ] **Step 1: Add learningData imports**

At the top of `src/components/CoursePreview.tsx`, add the import:
```typescript
import { enrollInCourse, getProgressForCourse, recordCourseOpen, markModuleComplete, CourseModule } from '../lib/learningData';
```

- [ ] **Step 2: Add moduleList and completedModuleIds state**

Inside the `CoursePreview` function, after the existing state declarations, add:
```typescript
const [moduleList, setModuleList] = useState<CourseModule[]>([]);
const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);
const [markingDone, setMarkingDone] = useState<string | null>(null); // moduleId being saved
```

- [ ] **Step 3: Update the user data useEffect to check enrolledCourses and fetch progress**

Find the existing `useEffect` that calls `checkUserData`. Replace the entire body of `checkUserData` with:
```typescript
const checkUserData = async () => {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data();
    const enrolledCourses: string[] = data.enrolledCourses || [];
    const wishlist: string[] = data.wishlist || [];
    const enrolled = enrolledCourses.includes(course.id);
    setIsEnrolled(enrolled);
    setIsWishlisted(wishlist.includes(course.id));

    if (enrolled) {
      const progress = await getProgressForCourse(user.uid, course.id);
      const completed = progress?.completedModules ?? [];
      setCompletedModuleIds(completed);
      setCompletedModules(completed.length);
    } else {
      setCompletedModules(0);
      setCompletedModuleIds([]);
    }
  }
};
```

- [ ] **Step 4: Add useEffect to fetch module list and record session open**

After the existing two `useEffect` blocks, add a new one:
```typescript
useEffect(() => {
  if (!course) {
    setModuleList([]);
    return;
  }
  // Course doc has a `modules` array — read it directly from the prop
  // (course is passed in from Solution/Explore which fetched it from Firestore)
  const mods = (course as any).modules as CourseModule[] | undefined;
  setModuleList(mods ?? []);

  if (user && isEnrolled) {
    recordCourseOpen(user.uid).catch(console.error);
  }
}, [course, user, isEnrolled]);
```

- [ ] **Step 5: Replace handleSaveCourse to use enrollInCourse**

Find the `handleSaveCourse` async function. Replace it entirely:
```typescript
const handleSaveCourse = async () => {
  if (!user || !course) {
    toast.error('Please sign in to enroll!');
    return;
  }
  toast.loading('Enrolling...', { id: 'enroll' });
  try {
    await enrollInCourse(user.uid, course.id, course.title);
    setIsEnrolled(true);
    toast.success('Successfully enrolled!', { id: 'enroll' });
  } catch (err) {
    console.error('Error enrolling', err);
    toast.error('Failed to enroll.', { id: 'enroll' });
  }
};
```

- [ ] **Step 6: Add handleMarkDone function (replaces handleContinue)**

Find and delete the `handleContinue` function entirely. Add `handleMarkDone` in its place:
```typescript
const handleMarkDone = async (moduleId: string, moduleName: string) => {
  if (!user || !course) return;
  setMarkingDone(moduleId);
  // Optimistic update
  setCompletedModuleIds((prev) => [...prev, moduleId]);
  setCompletedModules((prev) => prev + 1);
  try {
    const totalMods = moduleList.length || course.totalModules || 8;
    const { certificateEarned } = await markModuleComplete(
      user.uid,
      course.id,
      moduleId,
      moduleName,
      course.title,
      totalMods,
    );
    if (certificateEarned) {
      toast.success('🏆 Course complete — certificate earned!');
    } else {
      toast.success('Module complete!');
    }
  } catch (err) {
    // Rollback optimistic update on error
    setCompletedModuleIds((prev) => prev.filter((id) => id !== moduleId));
    setCompletedModules((prev) => prev - 1);
    console.error('Failed to mark module done', err);
    toast.error('Failed to save progress');
  } finally {
    setMarkingDone(null);
  }
};
```

- [ ] **Step 7: Update the action buttons section to show module checklist when enrolled**

Find the `<div className="sticky bottom-0 ...">` block from Task 3 (the action bar). Replace its content:
```tsx
<div className="sticky bottom-0 -mx-8 px-8 py-4 bg-background/95 backdrop-blur-sm border-t border-white/5 flex flex-col sm:flex-row items-center gap-4 mb-0 mt-4 z-10">
  {!isEnrolled ? (
    <button
      onClick={handleSaveCourse}
      className="w-full sm:w-auto px-8 py-3 bg-foreground text-background font-semibold rounded-full hover:scale-[1.02] transition-transform"
    >
      Enroll for ${course.price}
    </button>
  ) : (
    <>
      <span className="text-sm font-medium text-green-400 flex items-center gap-1 border border-green-500/30 bg-green-500/10 px-4 py-2 rounded-full">
        <CheckCircle2 size={16} /> Enrolled
      </span>
      {progressPercent === 100 && (
        <button
          onClick={handleDownloadCertificate}
          className="w-full sm:w-auto px-6 py-3 border border-white/10 font-semibold rounded-full hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Certificate
        </button>
      )}
    </>
  )}
</div>
```

Then, in the main scrollable content area, after the `<p className="text-muted-foreground...">` description paragraph and before the sticky bar, add the module checklist section. Insert it right after the description `</p>` tag:
```tsx
{isEnrolled && moduleList.length > 0 && (
  <div className="mt-8 mb-4">
    <h3 className="text-xs uppercase tracking-[3px] text-muted-foreground mb-4">
      Modules
    </h3>
    <div className="flex flex-col gap-2">
      {moduleList.map((mod) => {
        const done = completedModuleIds.includes(mod.id);
        const loading = markingDone === mod.id;
        return (
          <div
            key={mod.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
              done
                ? 'border-white/5 bg-white/[0.02]'
                : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.05]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                done ? 'bg-white/10 border-white/20' : 'border-white/20'
              }`}
            >
              {done && <CheckCircle2 size={12} className="text-white/60" />}
            </div>
            <span
              className={`flex-1 text-sm ${
                done ? 'line-through text-muted-foreground/50' : 'text-muted-foreground'
              }`}
            >
              {mod.title}
            </span>
            {!done && (
              <button
                onClick={() => handleMarkDone(mod.id, mod.title)}
                disabled={loading}
                className="text-xs text-muted-foreground/50 border border-white/10 rounded-lg px-3 py-1 hover:text-foreground hover:border-white/20 transition-colors disabled:opacity-30"
              >
                {loading ? '...' : 'Mark done'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
```

- [ ] **Step 8: Run dev server and test enrollment + module completion flow**

```bash
npm run dev
```

1. Sign in with Google.
2. Open any course from the landing page or Explore.
3. Click "Enroll for $X" — toast should say "Successfully enrolled!"
4. Close and reopen the same course — it should show "Enrolled" and the module list.
5. Click "Mark done" on the first module — the checkbox fills, toast shows "Module complete!"
6. In Firebase console, verify `users/{uid}/progress/{courseId}` exists with `completedModules: ['mod-1']`.
7. Verify `users/{uid}/activity` has a `module_complete` event.

Stop with `Ctrl+C`.

- [ ] **Step 9: Commit**

```bash
git add src/components/CoursePreview.tsx
git commit -m "feat: CoursePreview module checklist with Mark done and enrolledCourses migration"
```

---

## Task 8 — useDashboard hook

**Files:**
- Create: `src/hooks/useDashboard.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useDashboard.ts`:
```typescript
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  getRecentActivity,
  getCertificates,
  ActivityEvent,
  Certificate,
  CourseProgress,
  CourseModule,
} from '../lib/learningData';
import { useAuth } from './useAuth';

export interface CourseWithModules {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  modules: CourseModule[];
  totalModules: number;
}

export interface InProgressCourse {
  course: CourseWithModules;
  progress: CourseProgress;
}

export interface UserLearningData {
  enrolledCourses: string[];
  totalLearningSeconds: number;
  streakCount: number;
  longestStreak: number;
  weeklySeconds: number;
  prevWeeklySeconds: number;
  lastActiveDate: string;
  weeklySecondsUpdatedAt: string;
}

export interface DashboardData {
  userData: UserLearningData | null;
  inProgress: InProgressCourse[];
  completed: InProgressCourse[];
  activity: ActivityEvent[];
  certificates: Certificate[];
  loading: boolean;
}

const EMPTY: DashboardData = {
  userData: null,
  inProgress: [],
  completed: [],
  activity: [],
  certificates: [],
  loading: true,
};

export function useDashboard(): DashboardData {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<DashboardData>(EMPTY);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState({ ...EMPTY, loading: false });
      return;
    }

    let cancelled = false;

    const load = async () => {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const userData = userSnap.exists()
        ? (userSnap.data() as UserLearningData)
        : null;

      const enrolledIds: string[] = userData?.enrolledCourses ?? [];

      // Fetch each enrolled course + its progress in parallel
      const pairs = await Promise.all(
        enrolledIds.map(async (courseId) => {
          const [courseSnap, progressSnap] = await Promise.all([
            getDoc(doc(db, 'courses', courseId)),
            getDoc(doc(db, 'users', user.uid, 'progress', courseId)),
          ]);
          if (!courseSnap.exists()) return null;

          const course = {
            id: courseId,
            ...courseSnap.data(),
          } as CourseWithModules;

          const totalMods = course.modules?.length ?? course.totalModules ?? 8;
          const progress: CourseProgress = progressSnap.exists()
            ? (progressSnap.data() as CourseProgress)
            : {
                completedModules: [],
                totalModules: totalMods,
                lastModuleId: '',
                updatedAt: null,
              };

          return { course: { ...course, totalModules: totalMods }, progress };
        }),
      );

      const validPairs = pairs.filter(Boolean) as InProgressCourse[];
      const inProgress = validPairs.filter(
        (p) =>
          p.progress.completedModules.length > 0 &&
          p.progress.completedModules.length < p.course.totalModules,
      );
      const completed = validPairs.filter(
        (p) => p.progress.completedModules.length >= p.course.totalModules,
      );

      const [activity, certificates] = await Promise.all([
        getRecentActivity(user.uid),
        getCertificates(user.uid),
      ]);

      if (!cancelled) {
        setState({ userData, inProgress, completed, activity, certificates, loading: false });
      }
    };

    load().catch((err) => {
      console.error('Dashboard load error', err);
      if (!cancelled) setState((s) => ({ ...s, loading: false }));
    });

    return () => { cancelled = true; };
  }, [user, authLoading]);

  return state;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useDashboard.ts
git commit -m "feat: useDashboard hook for aggregated learner data"
```

---

## Task 9 — Rewrite Dashboard.tsx

**Files:**
- Modify: `src/components/Dashboard.tsx`

- [ ] **Step 1: Replace the entire file**

Replace `src/components/Dashboard.tsx` with:
```tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Award, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboard, CourseWithModules } from '../hooks/useDashboard';
import { relativeTime } from '../lib/relativeTime';
import { getWeekDots } from '../lib/learningData';
import { fadeUp } from '../lib/animations';
import { CoursePreview } from './CoursePreview';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { userData, inProgress, completed, activity, certificates, loading } = useDashboard();
  const [previewCourse, setPreviewCourse] = useState<CourseWithModules | null>(null);
  const navigate = useNavigate();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    toast.error('Sign in to view your dashboard');
    navigate('/');
    return null;
  }

  const firstName = user.displayName?.split(' ')[0] ?? 'there';
  const totalHours = Math.round((userData?.totalLearningSeconds ?? 0) / 3600);
  const weekHours = ((userData?.weeklySeconds ?? 0) / 3600).toFixed(1);
  const prevWeekHours = (userData?.prevWeeklySeconds ?? 0) / 3600;
  const weekDelta =
    prevWeekHours > 0
      ? Math.round(((Number(weekHours) - prevWeekHours) / prevWeekHours) * 100)
      : null;

  const activityDates = activity.map((a) => {
    const d = typeof (a.createdAt as any).toDate === 'function'
      ? (a.createdAt as any).toDate()
      : new Date(a.createdAt as any);
    return d.toISOString().split('T')[0];
  });
  const weekDots = getWeekDots(activityDates);

  const activityDotColor: Record<string, string> = {
    module_complete: 'bg-white/50',
    certificate_earned: 'bg-white/30',
    enrolled: 'bg-white/15',
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 max-w-5xl mx-auto">
      {/* Page header */}
      <motion.div {...fadeUp(0)} className="mb-10">
        <div className="text-xs uppercase tracking-[3px] text-muted-foreground mb-3">
          Your Dashboard
        </div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-[-1px]">
          Good morning,{' '}
          <span className="font-serif italic font-normal">{firstName}</span>
        </h1>
      </motion.div>

      {/* Profile strip */}
      <motion.div
        {...fadeUp(0.05)}
        className="liquid-glass border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-4"
      >
        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0 border border-white/10">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserCircle size={28} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base tracking-tight truncate">
            {user.displayName ?? 'Learner'}
          </p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-center px-4 py-2 liquid-glass rounded-2xl border border-white/5">
            <p className="text-lg font-semibold">{inProgress.length}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center px-4 py-2 liquid-glass rounded-2xl border border-white/5">
            <p className="text-lg font-semibold">{completed.length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center px-4 py-2 liquid-glass rounded-2xl border border-white/5">
            <p className="text-lg font-semibold">{totalHours}h</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </motion.div>

      {/* Streak + Certificates row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Streak */}
        <motion.div
          {...fadeUp(0.1)}
          className="liquid-glass border border-white/5 rounded-3xl p-6"
        >
          <p className="text-xs uppercase tracking-[3px] text-muted-foreground mb-5">
            Learning Streak
          </p>
          <div className="flex gap-3">
            <div className="flex-1 bg-black/30 rounded-2xl p-4 border border-white/5">
              <div className="flex gap-1.5 mb-3">
                {weekDots.map((state, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`h-2 rounded-sm ${
                        state === 'active'
                          ? 'bg-white/70'
                          : state === 'today'
                          ? 'bg-white/20'
                          : 'bg-white/5'
                      }`}
                    />
                    <span className="text-[9px] text-muted-foreground/40">
                      {WEEKDAYS[i]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold">
                  {userData?.streakCount ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">days</span>
                <Flame size={16} className="text-muted-foreground ml-auto" />
              </div>
            </div>
            <div className="flex-1 bg-black/30 rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-muted-foreground mb-2">This week</p>
              <p className="text-2xl font-semibold">{weekHours}h</p>
              {weekDelta !== null && (
                <p
                  className={`text-xs mt-1 ${
                    weekDelta >= 0 ? 'text-green-400/70' : 'text-red-400/70'
                  }`}
                >
                  {weekDelta >= 0 ? '↑' : '↓'} {Math.abs(weekDelta)}% vs last week
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Certificates */}
        <motion.div
          {...fadeUp(0.15)}
          className="liquid-glass border border-white/5 rounded-3xl p-6"
        >
          <p className="text-xs uppercase tracking-[3px] text-muted-foreground mb-5">
            Certificates Earned
          </p>
          {certificates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete all modules in a course to earn its certificate.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {certificates.map((cert) => (
                <div
                  key={cert.courseId}
                  className="flex items-center gap-3 bg-black/30 rounded-2xl px-4 py-3 border border-white/5"
                >
                  <Award size={18} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cert.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {cert.issuedAt?.toDate
                        ? cert.issuedAt.toDate().toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => toast('PDF certificates coming soon')}
                    className="text-xs text-muted-foreground/50 border border-white/10 rounded-lg px-3 py-1 hover:text-foreground hover:border-white/20 transition-colors flex-shrink-0"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Continue Learning */}
      <motion.div
        {...fadeUp(0.2)}
        className="liquid-glass border border-white/5 rounded-3xl p-6 mb-4"
      >
        <p className="text-xs uppercase tracking-[3px] text-muted-foreground mb-5">
          Continue Learning
        </p>
        {inProgress.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm mb-4">
              No courses in progress yet.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {inProgress.map(({ course, progress }) => {
              const pct = Math.round(
                (progress.completedModules.length / course.totalModules) * 100,
              );
              return (
                <div
                  key={course.id}
                  className="flex items-center gap-4 bg-black/30 rounded-2xl px-4 py-3 border border-white/5"
                >
                  <div className="w-10 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/40 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {progress.completedModules.length}/{course.totalModules} · {pct}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewCourse(course)}
                    className="bg-foreground text-background text-xs font-semibold rounded-full px-4 py-2 hover:opacity-90 transition-opacity flex-shrink-0"
                  >
                    Resume
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* CoursePreview modal — opened by Resume button */}
      <CoursePreview
        course={previewCourse as any}
        onClose={() => setPreviewCourse(null)}
      />

      {/* Activity Feed */}
      <motion.div
        {...fadeUp(0.25)}
        className="liquid-glass border border-white/5 rounded-3xl p-6"
      >
        <p className="text-xs uppercase tracking-[3px] text-muted-foreground mb-5">
          Recent Activity
        </p>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Your activity will appear here as you learn.
          </p>
        ) : (
          <div className="flex flex-col">
            {activity.map((event, i) => {
              const eventDate =
                typeof (event.createdAt as any).toDate === 'function'
                  ? (event.createdAt as any).toDate()
                  : new Date(event.createdAt as any);
              const text =
                event.type === 'module_complete'
                  ? `Completed ${event.moduleName} — ${event.courseName}`
                  : event.type === 'certificate_earned'
                  ? `Earned certificate: ${event.courseName}`
                  : `Enrolled in ${event.courseName}`;

              return (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 py-3 ${
                    i < activity.length - 1 ? 'border-b border-white/5' : ''
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                      activityDotColor[event.type] ?? 'bg-white/10'
                    }`}
                  />
                  <p className="flex-1 text-sm text-muted-foreground">{text}</p>
                  <span className="text-xs text-muted-foreground/40 flex-shrink-0">
                    {relativeTime(eventDate)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Run dev server and verify the full dashboard**

```bash
npm run dev
```

Sign in and navigate to `/dashboard`. Verify:
- Page header: overline + serif greeting with your first name
- Profile strip: avatar, name, email, stat chips
- Streak card: 7 dots, streak count, weekly hours (may be 0 if no activity yet)
- Certificates: empty state message if none
- Continue Learning: empty state with "Browse Courses" link if not enrolled yet
- Activity feed: empty state message

Enroll in a course (from Explore), mark a module done, return to dashboard — the in-progress card and activity feed should update.

Stop with `Ctrl+C`.

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: student dashboard with streak, progress, certificates, and activity feed"
```

---

## Task 10 — Build + Deploy

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected:
```
✓ src/lib/relativeTime.test.ts (6)
✓ src/lib/learningData.test.ts (4)
Test Files  2 passed (2)
Tests  10 passed (10)
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build completes with no TypeScript errors. Ignore the chunk size warning for `index-*.js` (Firebase SDK is large by nature).

- [ ] **Step 3: Deploy**

```bash
firebase deploy --only hosting
```

Expected:
```
✔  hosting: file upload complete
✔  hosting: release complete
Hosting URL: https://gen-lang-client-0585171045.web.app
```

- [ ] **Step 4: Smoke test production**

Open `https://guidenza.com` in a browser:
- Landing page loads, hero video plays
- CTA buttons are pill-shaped
- Mobile navbar has search in the dropdown
- Navigate to `/explore` — serif heading visible
- Sign in and navigate to `/dashboard` — full dashboard visible
- Open a course, enroll, mark a module done — dashboard updates

- [ ] **Step 5: Final commit**

```bash
git add package-lock.json
git commit -m "chore: post-deploy lockfile sync"
```

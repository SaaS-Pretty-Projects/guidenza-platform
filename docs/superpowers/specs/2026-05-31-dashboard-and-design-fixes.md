# Guidenza — Dashboard & Design Fixes
**Date:** 2026-05-31  
**Status:** Approved

---

## Scope

Two parallel tracks shipped together:

1. **Design fixes** — correct 7 concrete inconsistencies and responsiveness gaps across existing pages
2. **Student Dashboard** — replace the empty `/dashboard` shell with a fully functional learner hub backed by real Firestore data

---

## Track 1 — Design Fixes

### 1.1 Button shape consistency
**File:** `src/components/CTA.tsx`  
CTA section buttons use `rounded-lg`. Every other button in the app (Hero, Navbar) uses `rounded-full`. Fix: change both CTA buttons to `rounded-full`.

### 1.2 Hover class typo (broken hover effect)
**Files:** `src/components/Solution.tsx`, `src/components/Explore.tsx`  
Both use `hover:bg-white-[0.03]` — invalid Tailwind, hover silently does nothing. Fix: `hover:bg-white/[0.03]`.

### 1.3 Footer responsive grid
**File:** `src/components/Footer.tsx`  
Link columns use `grid-cols-2 md:grid-cols-3`. On tablets (768–900px) the third column orphans into a single-item row. Fix: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` so it stacks cleanly on narrow viewports.

### 1.4 Mobile navbar — missing search
**File:** `src/components/Navbar.tsx`  
`SearchBar` is `hidden md:flex` — mobile users get no search at all. Fix: add `SearchBar` inside the mobile menu `AnimatePresence` block, above the social links row.

### 1.5 Inner page typography
**Files:** `src/components/Explore.tsx`, `src/components/Dashboard.tsx`  
Both pages use a plain `text-4xl font-semibold` heading with no overline or serif accent — they feel disconnected from the landing page's design language.  
Fix: replace with the pattern established on the landing:
```tsx
<div className="text-xs uppercase tracking-[3px] text-muted-foreground mb-4">
  {overlineLabel}
</div>
<h1 className="text-4xl md:text-5xl font-medium tracking-[-1px]">
  Heading <span className="font-serif italic font-normal">accent</span>
</h1>
```
- Explore: overline "Explore Courses", heading "Find your next *expertise*"
- Dashboard: overline "Your Dashboard", heading "Good morning, *{firstName}*"

### 1.6 SearchChanged tablet padding
**File:** `src/components/SearchChanged.tsx`  
`pt-52 md:pt-64` jumps directly from mobile to desktop with no tablet stop. Fix: `pt-40 md:pt-52 lg:pt-64`.

### 1.7 CoursePreview modal mobile scroll
**File:** `src/components/CoursePreview.tsx`  
The modal doesn't constrain its height on mobile — enroll button can fall below the fold with no scroll affordance. Fix: set the modal content area to `max-h-[85dvh] overflow-y-auto` and ensure the action footer is `sticky bottom-0`.

---

## Track 2 — Student Dashboard

### 2.1 Firestore Data Model

New fields and collections added alongside the existing `users/{uid}` document and `courses/{id}` collection.

#### `users/{uid}` — new fields
```
savedCourses: string[]        // already exists
enrolledCourses: string[]     // NEW: courses the user has paid/enrolled in
totalLearningSeconds: number  // NEW: cumulative, updated on each session end
lastActiveDate: string        // NEW: ISO date "2026-05-31", for streak calculation
streakCount: number           // NEW: current streak in days
longestStreak: number         // NEW: all-time best streak
weeklySeconds: number         // NEW: seconds logged Mon–Sun this week
weeklySecondsUpdatedAt: string // NEW: ISO date of week start for reset detection
prevWeeklySeconds: number     // NEW: previous week's total, stored on reset for % delta
```

#### `users/{uid}/progress/{courseId}` — new subcollection
```
completedModules: string[]    // module IDs marked done
totalModules: number          // denormalized from course doc
lastModuleId: string          // most recently touched module
updatedAt: Timestamp
```

#### `users/{uid}/activity` — new subcollection (append-only)
```
type: 'module_complete' | 'enrolled' | 'certificate_earned'
courseId: string
courseName: string
moduleId?: string
moduleName?: string
createdAt: Timestamp
```

#### `users/{uid}/certificates/{courseId}` — new subcollection
Created automatically when `completedModules.length === totalModules`.
```
courseName: string
issuedAt: Timestamp
```

### 2.2 Streak Logic

Streak is recalculated on each dashboard load:
1. Read `lastActiveDate` from user doc.
2. If it equals today → streak is current (`streakCount` is accurate).
3. If it equals yesterday → streak is intact but not yet incremented today.
4. If older → streak resets to 0.

Two distinct write events:

- **On CoursePreview open** (enrolled course): write today's ISO date to `lastActiveDate`; if `lastActiveDate` was not already today, increment `streakCount` by 1 (and reset to 1 if the gap was >1 day). This registers the user "showed up."
- **On "Mark done" click**: add 1200s (20 min proxy) to both `totalLearningSeconds` and `weeklySeconds`. This registers actual work done.

Weekly hours reset: on dashboard load, if `weeklySecondsUpdatedAt` is from a previous week (Mon–Sun boundary), reset `weeklySeconds = 0` and update `weeklySecondsUpdatedAt`.

### 2.3 Dashboard UI — `/dashboard`

**Route:** `/dashboard` (existing, replace content of `Dashboard.tsx`)

**Layout:** Single-column max-width container (`max-w-5xl mx-auto`), no sidebar.

**Sections in render order:**

#### Header
```
[overline] Your Dashboard
[h1] Good morning, {firstName}   ← serif italic on firstName
```
First name extracted from `user.displayName.split(' ')[0]`.

#### Profile strip (card)
- Google avatar photo (or `UserCircle` fallback)
- Display name + email
- Three stat chips:
  - **In Progress**: count of progress docs where `0 < completedModules.length < totalModules`
  - **Completed**: count of docs in `certificates` subcollection
  - **Total hours**: `Math.round(totalLearningSeconds / 3600)` from user doc

#### Two-column row: Streak card + Certificates card

**Streak card:**
- 7-dot week view (Mon–Sun): **filled** (white/opaque) = had activity that day, **dim** (mid-grey) = today but no activity yet, **empty** (dark) = no activity
- Dot states derived by comparing each day's ISO date against the `activity` subcollection's `createdAt` dates for the current week
- Current streak number + fire emoji
- "This week" hours (from `weeklySeconds / 3600`, 1 decimal) + percentage delta vs `prevWeeklySeconds`

**Certificates card:**
- List from `certificates` subcollection
- Each row: trophy emoji, course name, issue date, "Download PDF" link (placeholder — renders a basic PDF via `window.print` scoped to the cert, or just shows a toast "Coming soon" for now)
- Empty state: "Complete all modules in a course to earn its certificate."

#### Continue Learning (full-width card)
- Query `enrolledCourses` → fetch progress docs → filter to courses with `0 < completedModules.length < totalModules`
- Sorted by `updatedAt` desc (most recently touched first)
- Each row: thumbnail, course name, "Module X of Y", progress bar (%), percentage label, **Resume** button
- Resume opens `CoursePreview` modal for that course
- If no in-progress courses: show empty state "No courses in progress — [Browse courses]"

#### Recent Activity (full-width card)
- Query `activity` subcollection, `orderBy('createdAt', 'desc')`, `limit(10)`
- Each item: coloured dot (white = module complete, mid-grey = certificate, dark = enrolled), text, relative timestamp
- Relative time: "2h ago", "Yesterday", "Jan 15" — using a lightweight helper (no external lib)

### 2.4 CoursePreview Changes — module checklist

When the current user is enrolled in the displayed course:

1. Fetch `users/{uid}/progress/{courseId}` on modal open.
2. Below the existing course description, render a "Modules" section.
3. Each module row shows: checkbox (filled if in `completedModules`), module name, **Mark done** button (hidden once checked).
4. On "Mark done" click:
   - Optimistic UI: immediately mark checked in local state
   - Write to Firestore: `arrayUnion(moduleId)` on `completedModules`
   - Update `lastActiveDate`, `streakCount`, `totalLearningSeconds` (add a fixed 20 min / 1200s per module as a proxy — real timing can be added later)
   - Append activity event to `users/{uid}/activity`
   - If `completedModules.length === totalModules` after update: write certificate doc, append `certificate_earned` activity
   - Show toast: "Module complete!" (or "🏆 Course complete — certificate earned!")

Module list comes from the course document. Courses need a `modules` array field:
```
modules: [{ id: string, title: string }]
```
The seeder (`src/lib/seeder.ts`) must be updated to add `modules` to each course. A default of 8 generic modules is acceptable if real module data doesn't exist yet.

### 2.5 Auth Guard

Dashboard redirects to `/` with a toast "Sign in to view your dashboard" if `!user && !loading`. Replace the current "Please sign in" plain text.

---

## What Is Explicitly Out of Scope

- Real video/content course player
- Payment flow / enrolment via checkout
- PDF certificate generation (Download shows a toast "Coming soon")
- Recommendation engine
- Saved courses shelf on Dashboard (user can still save from Explore)
- InstructorDashboard changes (separate feature)

---

## File Change Map

| File | Change |
|---|---|
| `src/components/CTA.tsx` | Button shape fix |
| `src/components/Solution.tsx` | Hover class fix |
| `src/components/Explore.tsx` | Hover class fix + inner page typography |
| `src/components/Footer.tsx` | Responsive grid fix |
| `src/components/Navbar.tsx` | SearchBar in mobile menu |
| `src/components/SearchChanged.tsx` | Tablet padding breakpoint |
| `src/components/CoursePreview.tsx` | Mobile scroll fix + module checklist |
| `src/components/Dashboard.tsx` | Full rewrite |
| `src/lib/seeder.ts` | Add `modules` array to course docs |
| `src/lib/firebase.ts` | No schema change — Firestore is schemaless |
| `src/hooks/useAuth.ts` | No change |

No new npm packages required. All UI uses existing Framer Motion, Lucide, and Tailwind. Firestore queries use existing `firebase/firestore` imports.

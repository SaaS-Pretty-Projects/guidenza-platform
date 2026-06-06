# Testing Patterns

**Analysis Date:** 2025-06-06

## Test Framework

**Runner:**
- Vitest 4.1.7
- Config: `vite.config.ts` (test section with environment: 'node')
- TypeScript support via Vite

**Assertion Library:**
- Vitest built-in `expect`
- Matchers: `toBe`, `toEqual`, `toHaveLength`, `toBeTruthy`, `toBeFalsy`

**Run Commands:**
```bash
npm test                              # Run all tests (vitest run)
npm run test:watch                    # Watch mode (vitest)
npm test -- path/to/file.test.ts      # Single file
```

## Test File Organization

**Location:**
- `*.test.ts` alongside source files in `src/lib/`
- No separate `tests/` or `__tests__/` directory
- Component tests: Not currently present (would be `*.test.tsx` alongside component)

**Naming:**
- `{module-name}.test.ts` for utility/service tests
- No distinction between unit/integration in filename

**Structure:**
```
src/lib/
  learningData.ts
  learningData.test.ts
  relativeTime.ts
  relativeTime.test.ts
  quizzes.ts
  quizzes.test.ts
  ai.ts
  (no test for ai.ts yet)
  firebase.ts
  (no test for firebase.ts yet)
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getWeekDots } from './learningData';

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
    expect(dots[6]).toBe('active'); // Sun 31 (today, with activity)
  });

  it('marks today as "today" when no activity yet', () => {
    const activityDates: string[] = [];
    const dots = getWeekDots(activityDates);
    expect(dots[6]).toBe('today'); // Sunday = today, no activity
  });

  it('returns exactly 7 dots', () => {
    expect(getWeekDots([])).toHaveLength(7);
  });
});
```

**Patterns:**
- `beforeEach`/`afterEach` for test setup/teardown (time mocking)
- `vi.useFakeTimers()` / `vi.useRealTimers()` for time-dependent tests
- `vi.setSystemTime()` to pin system time
- Arrange/Act/Assert implicit (no explicit comments)
- One assertion focus per test (multiple `expect` calls OK for related checks)

## Mocking

**Framework:**
- Vitest built-in mocking (`vi`)
- `vi.mock()` for module mocking (not yet used in existing tests)
- `vi.fn()` for function mocks
- `vi.mocked()` for typed mocks

**Patterns:**
```typescript
// Module mocking (for external dependencies)
vi.mock('./external-service', () => ({
  fetchData: vi.fn()
}));

// In test
const mockFetch = vi.mocked(fetchData);
mockFetch.mockResolvedValue({ data: 'test' });
```

**What to Mock (based on codebase needs):**
- Firebase Firestore (`firebase/firestore` functions: `doc`, `getDoc`, `setDoc`, etc.)
- Firebase Auth (`firebase/auth` functions)
- Fetch API (for `src/lib/ai.ts` API calls)
- Time/date (`vi.useFakeTimers`, `vi.setSystemTime`)
- External APIs (Gemini, SafePay)

**What NOT to Mock:**
- Pure functions (`getWeekDots`, `relativeTime`, `todayISO`, `weekStartISO`)
- Internal utilities (`animations.ts` functions)
- TypeScript types

## Fixtures and Factories

**Test Data:**
- Inline test data in test files (observed in `learningData.test.ts`, `relativeTime.test.ts`)
- No separate `tests/fixtures/` or `tests/factories/` directory
- Factory functions: Not currently used (would be defined in test file near usage)

**Examples:**
```typescript
// Inline activity dates for getWeekDots tests
const activityDates = ['2026-05-25', '2026-05-27', '2026-05-31'];

// Inline dates for relativeTime tests
const d = new Date('2026-05-31T11:59:30Z');
```

## Coverage

**Requirements:**
- No enforced coverage target
- Coverage not configured in `vite.config.ts` (would need `--coverage` flag)
- Focus on pure utility functions (`learningData.ts`, `relativeTime.ts`)

**Configuration:**
- Would use Vitest coverage via c8 (built-in): `npm test -- --coverage`
- Exclusions would include: `*.test.ts`, config files, entry points

**View Coverage:**
```bash
npm test -- --coverage
open coverage/index.html
```

## Test Types

**Unit Tests:**
- Scope: Single function in isolation
- Current: `getWeekDots`, `relativeTime`, `todayISO`, `weekStartISO`
- Mocking: Time (`vi.useFakeTimers`), no external dependencies
- Speed: <10ms per test

**Integration Tests:**
- Not currently implemented
- Would test: Firebase operations, API client functions, hook behavior
- Setup: Firebase emulators or mocked Firestore

**E2E Tests:**
- Not currently implemented
- Would use: Playwright or Cypress (not installed)
- Scope: Full user flows (auth, course purchase, quiz taking)

**Component Tests:**
- Not currently implemented
- Would use: `@testing-library/react` with Vitest (available in ecosystem)
- Scope: Component rendering, user interactions, prop variations

## Common Patterns

**Async Testing:**
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

**Error Testing:**
```typescript
it('should throw on invalid input', () => {
  expect(() => functionCall()).toThrow('error message');
});

it('should reject on failure', async () => {
  await expect(asyncCall()).rejects.toThrow('error message');
});
```

**Time Mocking:**
```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-31T10:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});
```

**Firebase Mocking (pattern for future tests):**
```typescript
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));
```

---

*Testing analysis: 2025-06-06*
*Update when test patterns change*
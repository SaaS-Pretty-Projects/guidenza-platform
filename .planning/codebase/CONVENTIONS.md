# Coding Conventions

**Analysis Date:** 2025-06-06

## Naming Patterns

**Files:**
- PascalCase.tsx: React components (`AITutor.tsx`, `CoursePreview.tsx`, `Dashboard.tsx`)
- camelCase.ts: Utilities, services, hooks (`learningData.ts`, `useAuth.ts`, `ai.ts`, `animations.ts`)
- camelCase.test.ts: Test files co-located (`learningData.test.ts`, `relativeTime.test.ts`)
- kebab-case: Config files (`vite.config.ts`, `eslint.config.js`, `firebase.json`)
- UPPERCASE: Important project files (`README.md`, `AGENTS.md`, `PROJECT.md`)

**Functions:**
- camelCase for all functions (`getWeekDots`, `markModuleComplete`, `generateQuiz`)
- No special prefix for async functions (all async functions use camelCase)
- Handler pattern: `handleEventName` for event handlers (`handleFirestoreError`)
- Hook pattern: `useHookName` for custom hooks (`useAuth`, `useDashboard`, `usePurchase`)

**Variables:**
- camelCase for variables (`userData`, `inProgress`, `weekDots`, `previewCourse`)
- UPPER_SNAKE_CASE for constants (`WEEKDAYS`, `EMPTY`, `AI_API_BASE`)
- No underscore prefix for private members (TypeScript `private` keyword used if needed)

**Types:**
- PascalCase for interfaces (`CourseModule`, `CourseProgress`, `ActivityEvent`, `Quiz`, `QuizQuestion`)
- PascalCase for type aliases (`Difficulty`, `GeneratedQuiz`, `DashboardData`, `UserLearningData`)
- PascalCase for enums (`OperationType`)
- Generic type parameters: Single uppercase letter (`T`, `E`, `K`)

**Components:**
- PascalCase for component names (`AITutor`, `CoursePreview`, `QuizEditor`)
- Props interface: ComponentName + `Props` (`AITutorProps`, `CoursePreviewProps`)
- Default export for components

## Code Style

**Formatting:**
- Prettier (implied by Vite/React ecosystem, no explicit .prettierrc found)
- TypeScript/ESLint for formatting enforcement
- Single quotes for strings (observed in codebase)
- Semicolons required
- 2 space indentation
- Trailing commas in multiline objects/arrays

**Linting:**
- ESLint with flat config (`eslint.config.js`)
- `@firebase/eslint-plugin-security-rules` for Firestore rules
- TypeScript ESLint recommended rules
- Run: `npm run lint` (executes `tsc --noEmit`)

**TypeScript:**
- Strict mode enabled (via tsconfig.json: `isolatedModules`, `moduleDetection: force`)
- Path aliases: `@/*` maps to `./*` (src/ root)
- JSX: `react-jsx` transform
- Target: ES2022
- Module: ESNext with bundler resolution
- `allowImportingTsExtensions: true` for explicit .ts imports

## Import Organization

**Order:**
1. External packages (react, firebase, framer-motion, lucide-react, etc.)
2. Internal modules (absolute imports via `@/` alias)
3. Relative imports (./, ../)
4. Type imports (`import type {}`)

**Grouping:**
- Blank line between groups
- Alphabetical within each group (not strictly enforced but observed)
- Type imports grouped with their source

**Path Aliases:**
- `@/` maps to project root (`.`)
- Used for: `@/components`, `@/hooks`, `@/lib`, `@/contexts`, `@/pages`, `@/assets`

**Examples from codebase:**
```typescript
// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Award, Flame } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboard, CourseWithModules } from '../hooks/useDashboard';
import { relativeTime } from '../lib/relativeTime';
import { getWeekDots } from '../lib/learningData';
import { fadeUp } from '../lib/animations';
import { CoursePreview } from './CoursePreview';
import { OrderHistory } from './OrderHistory';
import toast from 'react-hot-toast';
```

## Error Handling

**Patterns:**
- Try/catch in async functions (both client and server)
- Errors thrown with descriptive messages
- Server: Returns JSON `{ error: string }` with appropriate HTTP status
- Client: Shows errors via `react-hot-toast` (toast.error)
- Firebase: `handleFirestoreError` serializes error with auth context and operation metadata

**Error Types:**
- Client: Network errors, Firebase errors, validation errors
- Server: Validation errors (400), Authentication errors (401/403), Not found (404), Server errors (500)
- Custom: `handleFirestoreError` creates structured error objects

**Async Handling:**
- async/await used consistently
- No `.catch()` chains observed (prefers try/catch)
- Promise.all for parallel operations

**Examples:**
```typescript
// src/lib/firebase.ts - Structured error handling
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: { ... },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// src/hooks/useDashboard.ts - Try/catch with cleanup
load().catch((err) => {
  console.error('Dashboard load error', err);
  if (!cancelled) setState((s) => ({ ...s, loading: false }));
});
```

## Logging

**Framework:**
- Console API (`console.error`, `console.log`)
- No dedicated logging library (pino, winston)

**Patterns:**
- `console.error` for errors with context
- `console.log` for server startup info
- Structured logging: `handleFirestoreError` creates JSON with operation metadata

**When to Log:**
- Errors with context (Firebase operations, API failures)
- Server startup (port, environment)
- Debugging (commented out or removed in production)

**Where:**
- Service boundaries (Firebase operations, API calls)
- Not in utility functions

## Comments

**When to Comment:**
- Explain "why" not "what"
- Document business logic, algorithms, edge cases
- JSDoc for exported functions in lib files
- Avoid obvious comments

**JSDoc/TSDoc:**
- Used for exported functions in `src/lib/learningData.ts` and `src/lib/quizzes.ts`
- Format: `/** Description */` with `@param`, `@returns` tags
- Not used for internal functions or component props

**Examples:**
```typescript
// src/lib/learningData.ts
/**
 * Records a "Mark done" click on a module.
 * Writes progress, adds 1200s (20 min proxy) to time fields, appends activity.
 * Issues a certificate if all modules are complete.
 */
export async function markModuleComplete(...) { ... }
```

**TODO Comments:**
- Format: `// TODO: description` (no username)
- Observed: Minimal TODO comments in codebase

## Function Design

**Size:**
- Keep functions focused (observed: 20-50 lines typical)
- Extract helpers for complex logic (e.g., `buildQuizPrompt`, `buildTutorPrompt` in server/ai.ts)
- One level of abstraction per function

**Parameters:**
- Max 3-4 parameters, use object for more
- Destructure objects in parameter list: `function markModuleComplete(uid: string, courseId: string, ...)`
- Options objects for optional parameters: `generateQuiz(courseId, moduleId, difficulty = 'medium', questionCount = 5)`

**Return Values:**
- Explicit return statements
- Return early for guard clauses
- Async functions return Promises (explicit Promise<Type> in signatures)

**Examples:**
```typescript
// Guard clause pattern
export async function markModuleComplete(...) {
  const progressSnap = await getDoc(progressRef);
  const existing = progressSnap.exists() ? ... : { ... };
  
  if (existing.completedModules.includes(moduleId)) {
    return { certificateEarned: false }; // Early return
  }
  // ... rest of function
}
```

## Module Design

**Exports:**
- Named exports for utilities and services (`export function`, `export interface`, `export type`)
- Default export for React components (`export default function ComponentName`)
- Re-exports not used (no barrel files/index.ts)

**File Organization:**
- Each file has single responsibility
- Types co-located with functions that use them
- Test files co-located with source (`*.test.ts`)

**Dependencies:**
- Avoid circular dependencies (layered architecture prevents this)
- Client lib doesn't import from components
- Server doesn't import from client

---

*Convention analysis: 2025-06-06*
*Update when patterns change*
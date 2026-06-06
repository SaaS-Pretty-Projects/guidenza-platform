# Architecture

**Analysis Date:** 2025-06-06

## Pattern Overview

**Overall:** Full-stack React Application with Separate Express API Server

**Key Characteristics:**
- Client: SPA built with React 19 + Vite, deployed as static assets
- Server: Express.js REST API for payments, AI features, and server-side Firebase operations
- Shared: Firebase Firestore as primary database (client + server access)
- Authentication: Firebase Auth (client-side Google OAuth, server-side Admin SDK)
- AI: Server-side Gemini API integration (API keys not exposed to client)

## Layers

**Client - Presentation Layer:**
- Purpose: UI rendering, user interaction, state management
- Contains: React components (`src/components/`), pages (`src/pages/`), hooks (`src/hooks/`), context providers
- Location: `src/`
- Depends on: Client Firebase SDK, React Router, API client (`src/lib/ai.ts`)
- Used by: Browser

**Client - Data Access Layer:**
- Purpose: Firebase operations, business logic for learning progress
- Contains: `src/lib/learningData.ts` (progress, certificates, activity), `src/lib/quizzes.ts` (quiz CRUD), `src/lib/orders.ts`, `src/lib/firebase.ts`
- Location: `src/lib/`
- Depends on: Firebase client SDK
- Used by: Presentation layer (hooks, components)

**Client - API Integration Layer:**
- Purpose: Communication with Express server for AI features
- Contains: `src/lib/ai.ts` (generateQuiz, askTutor, getModuleSummary)
- Location: `src/lib/ai.ts`
- Depends on: Fetch API, `VITE_API_URL` env var
- Used by: Components (AITutor, QuizEditor, CoursePreview)

**Server - API Layer:**
- Purpose: REST endpoints for payments, AI, webhooks
- Contains: Express routes in `server/index.ts`
- Location: `server/index.ts`
- Depends on: Server Firebase Admin SDK, SafePay SDK, Gemini API
- Used by: Client (via fetch), SafePay webhooks

**Server - Business Logic Layer:**
- Purpose: AI prompt engineering, payment processing, webhook handling
- Contains: `server/ai.ts` (quiz generation, tutoring, summarization), `server/safePay.ts` (transactions, webhooks)
- Location: `server/ai.ts`, `server/safePay.ts`
- Depends on: Server Firebase Admin SDK, external APIs
- Used by: API Layer routes

**Server - Data Access Layer:**
- Purpose: Firestore operations with admin privileges
- Contains: `server/firebase.ts` (admin app initialization, db/auth exports)
- Location: `server/firebase.ts`
- Depends on: firebase-admin SDK
- Used by: Business Logic Layer, API Layer

**Shared - Database:**
- Purpose: Persistent data storage
- Contains: Firestore collections (users, courses, orders, progress, activity, certificates, quizzes, quizAttempts)
- Access: Client SDK (user-scoped), Admin SDK (server operations)
- Security: Firestore rules (`firestore.rules`)

## Data Flow

**User Authentication (Client):**
1. User clicks "Sign in with Google" in Navbar
2. `useAuth.login()` calls `signInWithPopup(GoogleAuthProvider)`
3. Firebase Auth returns user credential
4. Auth state listener in `useAuth` updates user context
5. Dashboard loads user data via `useDashboard` hook

**Course Enrollment & Payment:**
1. User clicks purchase on CoursePreview
2. Client calls `/api/checkout` with courseId, userId, amount
3. Server creates SafePay transaction, returns checkoutUrl
4. User redirected to SafePay, completes payment
5. SafePay calls `/api/webhook/safepay` with payload
6. Server verifies HMAC signature, updates order status
7. Server adds course to user's `purchasedCourses` and `enrolledCourses`
7. Server logs activity event

**AI Quiz Generation:**
1. Instructor opens QuizEditor, clicks "Generate with AI"
2. Client calls `generateQuiz(courseId, moduleId, ...)` in `src/lib/ai.ts`
3. Client POSTs to `/api/ai/generate-quiz`
4. Server fetches module content from Firestore (`getModuleContent`)
5. Server builds prompt, calls Gemini API
6. Server parses JSON response, returns quiz structure
7. Client receives quiz, populates QuizEditor form

**AI Tutoring:**
1. Student clicks "I'm stuck" in CoursePreview, asks question
2. Client calls `askTutor(courseId, moduleId, question)` in `src/lib/ai.ts`
3. Client POSTs to `/api/ai/tutor`
4. Server fetches module content, builds tutor prompt
5. Server calls Gemini API, returns answer
3. Client displays answer in AITutor modal

**Learning Progress Tracking:**
1. Student clicks "Mark Done" on module in CoursePreview
3. `markModuleComplete()` in `src/lib/learningData.ts` writes to Firestore
4. Updates user's progress subcollection, totalLearningSeconds, streak
5. Adds activity event to user's activity subcollection
6. If all modules complete, issues certificate

**State Management:**
- Client: React hooks (`useAuth`, `useDashboard`) + Firebase real-time listeners (not currently used, but available)
- Server: Stateless (each request independent, Firebase for persistence)
- No global state management library (Redux, Zustand) - uses React Context + hooks

## Key Abstractions

**Firebase Client Wrapper (`src/lib/firebase.ts`):**
- Purpose: Initialize Firebase app, export db/auth, error handling
- Pattern: Module-level initialization, singleton-like exports
- Error handling: `handleFirestoreError` captures auth context for debugging

**Learning Data Service (`src/lib/learningData.ts`):**
- Purpose: All user progress operations (enroll, complete, streak, certificates)
- Pattern: Pure helper functions (testable) + Firestore write helpers
- Key functions: `recordCourseOpen`, `markModuleComplete`, `enrollInCourse`, `getProgressForCourse`, `getRecentActivity`, `getCertificates`

**Quiz Service (`src/lib/quizzes.ts`):**
- Purpose: Quiz CRUD and attempt submission
- Pattern: Async functions with Firestore operations
- Key functions: `createQuiz`, `updateQuiz`, `deleteQuiz`, `getModuleQuizzes`, `getQuiz`, `submitQuizAttempt`, `getUserQuizAttempts`

**Dashboard Hook (`src/hooks/useDashboard.ts`):**
- Purpose: Aggregate user learning data for dashboard
- Pattern: React hook with useEffect for data loading, cancellation cleanup
- Returns: `{ userData, inProgress, completed, activity, certificates, loading }`

**AI Service (`server/ai.ts`):**
- Purpose: Gemini prompt engineering and response parsing
- Pattern: Pure functions for prompts (`buildQuizPrompt`, `buildTutorPrompt`, `buildSummaryPrompt`), async call/parse functions
- Handles: JSON extraction from markdown code blocks, fallback parsing

**SafePay Service (`server/safePay.ts`):**
- Purpose: Payment transaction creation and webhook verification
- Pattern: Async functions for API calls, HMAC verification
- Key: `createTransaction`, `handleWebhook`, `computeHmac`

## Entry Points

**Client Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads `index.html`
- Responsibilities: Initialize Firebase, seed courses, render App

**Client Router:**
- Location: `src/App.tsx`
- Triggers: URL changes
- Routes: `/` (Landing), `/dashboard`, `/explore`, `/instructor/:authorName`, `/instructor-dashboard`, `/checkout-result`

**Server Entry:**
- Location: `server/index.ts`
- Triggers: `npm run dev:api` (tsx watch) or `npm start` (node dist)
- Responsibilities: Express setup, CORS, middleware, route registration, listen on PORT

## Error Handling

**Strategy:**
- Client: Try/catch in async functions, error boundaries not used, toast notifications for user-facing errors
- Server: Try/catch in route handlers, structured error responses (500 with error message), console.error for logging
- Firebase: `handleFirestoreError` captures operation type, path, and auth info for debugging

**Patterns:**
- Client: `fetch` calls wrapped in try/catch, errors shown via `react-hot-toast`
- Server: Route handlers catch errors, return JSON `{ error: string }` with appropriate status codes
- Validation: Early returns for missing required fields (400)
- Firebase errors: Serialized with auth context, re-thrown as Error with JSON string

## Cross-Cutting Concerns

**Logging:**
- Client: `console.error` for errors, `console.log` for debugging
- Server: `console.error` for errors, `console.log` for startup info
- Structured: `handleFirestoreError` creates JSON error objects with context

**Validation:**
- Client: TypeScript types, runtime checks in API functions
- Server: Manual validation in route handlers (early 400 returns)
- Firebase: Firestore rules for server-side validation

**Authentication:**
- Client: Firebase Auth state listener (`onAuthStateChanged`)
- Server: Firebase Admin SDK for server-side operations (no request auth middleware currently)
- Protected routes: Client-side redirects in `useDashboard` hook

**CORS:**
- Configured in `server/index.ts` with `CLIENT_ORIGIN` env var
- Credentials enabled for cookie-based auth (if needed)

**Environment Configuration:**
- Client: Vite `loadEnv` in `vite.config.ts`, exposed via `import.meta.env`
- Server: `process.env` directly, dotenv loaded implicitly by Node.js 20+

---

*Architecture analysis: 2025-06-06*
*Update when major patterns change*
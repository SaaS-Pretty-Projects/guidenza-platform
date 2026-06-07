# Concerns & Technical Debt

**Analysis Date:** 2025-06-06

## Technical Debt

### 1. Missing Server-Side TypeScript Compilation
**Location:** `server/`
**Issue:** Server uses `tsx watch` for development but has no production build pipeline. `tsconfig.json` exists but `npm run build` only builds client (Vite). Server TypeScript errors only caught at runtime.
**Warning Signs:** `npx tsc --noEmit` shows errors in `server/` (missing `firebase-admin`, `cors` types)
**Prevention:** Add server build script, ensure types are installed
**Phase to Address:** Infrastructure/DevOps phase

### 2. No Firebase Admin Types in Client Package
**Location:** `package.json` (root)
**Issue:** `firebase-admin` and `@types/cors` are only in `server/package.json` but root `tsc --noEmit` tries to type-check server files and fails.
**Warning Signs:** TypeScript errors: "Cannot find module 'firebase-admin'", "Cannot find module 'cors'"
**Prevention:** Either exclude server from root tsconfig, or add types to root devDependencies
**Phase to Address:** Immediate (blocks lint/typecheck)

### 3. Mission.tsx Type Errors
**Location:** `src/components/Mission.tsx` lines 93, 106
**Issue:** Component props include `key` which is not in the component's props interface
**Warning Signs:** TypeScript errors: "Property 'key' does not exist on type"
**Prevention:** Fix component props interface or remove explicit key from JSX
**Phase to Address:** Bug fix phase

### 4. No Error Boundaries in React App
**Location:** `src/App.tsx`, `src/main.tsx`
**Issue:** Uncaught component errors will crash the entire app. No `ErrorBoundary` component implemented.
**Warning Signs:** Any component throw shows white screen
**Prevention:** Add class-based ErrorBoundary or use `react-error-boundary` package
**Phase to Address:** Stability phase

### 5. Server Lacks Request Authentication Middleware
**Location:** `server/index.ts`
**Issue:** API routes don't verify Firebase Auth tokens. Any caller can access `/api/ai/*`, `/api/checkout`, `/api/orders/:userId` without authentication.
**Warning Signs:** No `Authorization` header checks, no `admin.auth().verifyIdToken()` calls
**Prevention:** Add auth middleware using Firebase Admin SDK
**Phase to Address:** Security phase (critical)

### 6. Firestore Rules May Be Overly Permissive
**Location:** `firestore.rules`
**Issue:** Need to verify rules enforce user data isolation (users can only read/write their own data)
**Warning Signs:** Rules not reviewed in this analysis
**Prevention:** Audit rules against data access patterns in `learningData.ts`, `quizzes.ts`, `useDashboard.ts`
**Phase to Address:** Security phase

### 7. No Input Validation on Server Routes
**Location:** `server/index.ts`
**Issue:** Routes check for required fields but no schema validation (Zod, Joi, etc.)
**Warning Signs:** Manual `if (!field)` checks, no type coercion or sanitization
**Prevention:** Add Zod schemas for each endpoint
**Phase to Address:** API hardening phase

### 8. Client Uses `any` Type in Several Places
**Location:** `src/components/Dashboard.tsx` (line 337: `course={previewCourse as any}`)
**Issue:** Type casting defeats TypeScript safety
**Warning Signs:** `as any` casts, implicit `any` in callbacks
**Prevention:** Define proper types for CoursePreview props
**Phase to Address:** Type safety phase

## Bugs & Issues

### 1. Server Dependencies Not Installed in Root
**Location:** Root `package.json` vs `server/package.json`
**Issue:** Running `npm install` at root doesn't install server dependencies. Server must be installed separately.
**Impact:** New developers may miss server setup
**Fix:** Document in README, or use npm workspaces

### 2. No Health Check Endpoint
**Location:** `server/index.ts`
**Issue:** No `/health` or `/ready` endpoint for load balancers/monitoring
**Impact:** Can't verify server health in production
**Fix:** Add `app.get('/health', (req, res) => res.json({ ok: true }))`

### 3. CORS Configuration Hardcoded Fallback
**Location:** `server/index.ts` line 10
**Issue:** `CLIENT_ORIGIN` defaults to `http://localhost:3000` - not production-ready
**Impact:** Production deployment requires env var override
**Fix:** Document required env vars, validate in startup

### 4. SafePay Webhook Uses Raw Body Parsing
**Location:** `server/index.ts` line 13
**Issue:** `express.text({ type: '*/*' })` for webhook - may conflict with JSON middleware
**Impact:** Potential parsing issues for other routes
**Fix:** Use specific path middleware ordering

### 5. Gemini API Error Handling Returns Raw Error Text
**Location:** `server/ai.ts` line 90-91
**Issue:** `throw new Error(\`Gemini API error: ${response.status} ${err}\`)` - exposes internal error details
**Impact:** Information leakage in production
**Fix:** Sanitize error messages, log details server-side only

### 6. No Rate Limiting on AI Endpoints
**Location:** `server/index.ts` routes `/api/ai/*`
**Issue:** Unlimited calls to Gemini API - cost and abuse risk
**Impact:** Potential high costs, API quota exhaustion
**Fix:** Add rate limiting middleware (express-rate-limit)

## Security Concerns

### 1. API Keys in Client Build
**Location:** `vite.config.ts` line 12-14
**Issue:** `process.env.GEMINI_API_KEY` is defined into client bundle via `define`
**Impact:** Gemini API key exposed in client JavaScript
**Fix:** Move ALL AI calls to server (already done for quiz/tutor/summary), remove `define` for GEMINI_API_KEY

### 2. Firebase Config in Client Bundle
**Location:** `src/lib/firebase.ts` line 4
**Issue:** `firebase-applet-config.json` imported directly - contains API key, project ID, app ID
**Impact:** Firebase config exposed (normal for Firebase web apps, but be aware)
**Mitigation:** Firebase Auth domain restrictions, Firestore rules are primary security

### 3. Service Account in Environment Variables
**Location:** `server/firebase.ts` lines 3-7
**Issue:** `FIREBASE_PRIVATE_KEY` with newlines in env var - fragile
**Impact:** Deployment issues if newlines not handled correctly
**Fix:** Use secret manager, or base64-encoded private key

### 4. No Helmet/CSP Headers
**Location:** `server/index.ts`
**Issue:** Express app doesn't set security headers
**Impact:** Missing X-Frame-Options, CSP, HSTS, etc.
**Fix:** Add `helmet` middleware

## Performance Concerns

### 1. Dashboard Loads All Enrolled Courses Sequentially
**Location:** `src/hooks/useDashboard.ts` lines 78-103
**Issue:** `Promise.all` with map - but each course does 2 Firestore reads (course + progress)
**Impact:** N*2 reads for N enrolled courses
**Optimization:** Consider batch reads, or denormalize course metadata in user document

### 2. No Firestore Indexes Defined
**Location:** `firestore.rules` / Firebase Console
**Issue:** Queries with `where` + `orderBy` require composite indexes
**Impact:** Queries fail in production without indexes
**Fix:** Define indexes in `firestore.indexes.json` or create via console

### 3. Activity Feed Limited to 10 Items
**Location:** `src/lib/learningData.ts` line 230
**Issue:** Hardcoded `limit(10)` - no pagination
**Impact:** Users can't see full history
**Fix:** Add pagination support

### 4. Course Data Fetched Repeatedly
**Location:** `src/hooks/useDashboard.ts`, `src/components/CoursePreview.tsx`
**Issue:** Course data fetched in multiple places without caching
**Impact:** Redundant Firestore reads
**Optimization:** React Query / SWR, or context-based caching

## Architecture Concerns

### 1. Dual Package.json Structure
**Location:** Root + `server/package.json`
**Issue:** Two separate dependency trees, duplicate TypeScript configs
**Impact:** Version drift, maintenance overhead
**Fix:** Consider npm workspaces or monorepo tool (Turborepo, Nx)

### 2. No Shared Types Between Client/Server
**Location:** `src/lib/quizzes.ts` vs `server/types.ts`
**Issue:** Quiz interfaces defined separately (QuizQuestion vs QuizQuestion in server/ai.ts)
**Impact:** Type drift, duplication
**Fix:** Create shared `types` package or common directory

### 3. Server Business Logic in Route Handlers
**Location:** `server/index.ts` lines 16-123
**Issue:** Checkout, webhook, AI logic inline in routes
**Impact:** Hard to test, reuse, or modify
**Fix:** Extract to service layer (partially done with ai.ts, safePay.ts)

### 4. No API Versioning
**Location:** `server/index.ts`
**Issue:** Routes at `/api/*` with no version prefix
**Impact:** Breaking changes require coordinated deploy
**Fix:** Use `/api/v1/*` prefix

## Fragile Areas

### 1. Firebase Emulator Not Configured
**Location:** `firebase.json`
**Issue:** No local emulator config for Firestore/Auth
**Impact:** Integration testing requires live Firebase project
**Fix:** Add emulator config to firebase.json

### 2. Environment-Specific Config Scattered
**Location:** Multiple files
**Issue:** Client uses `import.meta.env`, server uses `process.env`, Vite uses `loadEnv`
**Impact:** Inconsistent access patterns
**Fix:** Centralize config module

### 3. No Database Migration Strategy
**Location:** Firestore (schemaless)
**Issue:** No migration scripts for data schema changes
**Impact:** Manual data fixes required for schema changes
**Fix:** Document migration procedures, use versioned collections

---

*Concerns analysis: 2025-06-06*
*Update when issues are resolved or new ones discovered*
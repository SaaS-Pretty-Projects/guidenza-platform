# Codebase Structure

**Analysis Date:** 2025-06-06

## Directory Layout

```
Guidenza/
├── .planning/              # GSD planning artifacts (this directory)
│   ├── codebase/          # Codebase map documents
│   └── config.json        # GSD workflow configuration
├── .superpowers/          # AI brainstorming artifacts
├── .worktrees/            # Git worktrees for parallel development
├── dist/                  # Build output (client)
├── node_modules/          # Dependencies (gitignored)
├── public/                # Static assets
├── server/                # Express API server
│   ├── ai.ts              # AI prompt engineering & Gemini calls
│   ├── firebase.ts        # Firebase Admin SDK initialization
│   ├── index.ts           # Express app entry point
│   ├── package.json       # Server dependencies
│   ├── safePay.ts         # Payment processing & webhooks
│   ├── tsconfig.json      # Server TypeScript config
│   └── types.ts           # Server TypeScript types
├── src/                   # React client application
│   ├── components/        # React components (30+ files)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Client-side services & utilities
│   ├── pages/             # Page components
│   ├── contexts/          # React Context providers
│   ├── assets/            # Images, fonts
│   ├── App.tsx            # Root component + routing
│   ├── main.tsx           # Client entry point
│   ├── index.css          # Global styles + Tailwind
│   └── vite-env.d.ts      # Vite type declarations
├── .env                   # Environment variables (gitignored)
├── .firebaserc            # Firebase project config
├── .gitignore
├── eslint.config.js       # ESLint flat config
├── firebase-applet-config.json  # Firebase web app config
├── firebase-blueprint.json      # Firebase project blueprint
├── firebase.json          # Firebase CLI config
├── firestore.rules        # Firestore security rules
├── index.html             # HTML entry point
├── metadata.json          # Project metadata
├── package.json           # Client dependencies
├── package-lock.json
├── tsconfig.json          # Client TypeScript config
└── vite.config.ts         # Vite configuration
```

## Directory Purposes

**src/**
- Purpose: React client application source code
- Contains: Components, hooks, lib, pages, contexts, styles
- Key files: `main.tsx`, `App.tsx`, `index.css`
- Subdirectories: `components/`, `hooks/`, `lib/`, `pages/`, `contexts/`, `assets/`

**src/components/**
- Purpose: Reusable UI components
- Contains: 30+ component files (AITutor, CoursePreview, Dashboard, Navbar, etc.)
- Key files: `AITutor.tsx`, `CoursePreview.tsx`, `Dashboard.tsx`, `QuizEditor.tsx`, `QuizViewer.tsx`
- Subdirectories: None (flat structure)

**src/hooks/**
- Purpose: Custom React hooks for state and data fetching
- Contains: `useAuth.ts`, `useDashboard.ts`, `usePurchase.ts`, `useLenis.ts`, `useMagnetic.ts`, `useRateLimit.ts`, `useReducedMotion.ts`, `useTilt.ts`
- Key files: `useAuth.ts` (Firebase auth state), `useDashboard.ts` (learning data aggregation)
- Subdirectories: None

**src/lib/**
- Purpose: Client-side services, utilities, and Firebase operations
- Contains: `firebase.ts`, `ai.ts`, `learningData.ts`, `learningData.test.ts`, `quizzes.ts`, `quizzes.test.ts`, `orders.ts`, `relativeTime.ts`, `relativeTime.test.ts`, `animations.ts`, `certificate.ts`, `seeder.ts`
- Key files: `firebase.ts` (client SDK init), `learningData.ts` (progress tracking), `quizzes.ts` (quiz CRUD), `ai.ts` (API client)
- Subdirectories: None

**src/pages/**
- Purpose: Page-level components for routing
- Contains: `CheckoutResult.tsx`
- Key files: `CheckoutResult.tsx`
- Subdirectories: None

**src/contexts/**
- Purpose: React Context providers
- Contains: `AuthContext.tsx`, `CreditsContext.tsx`
- Key files: `AuthContext.tsx` (auth state provider)
- Subdirectories: None

**server/**
- Purpose: Express API server
- Contains: `index.ts` (entry), `ai.ts` (Gemini integration), `safePay.ts` (payments), `firebase.ts` (Admin SDK), `types.ts`
- Key files: `index.ts`, `ai.ts`, `safePay.ts`
- Subdirectories: None

**server/** (package management)
- Purpose: Separate package.json for server dependencies
- Contains: `package.json`, `package-lock.json`, `tsconfig.json`

**public/**
- Purpose: Static assets served directly
- Contains: (empty or minimal)
- Subdirectories: None

**.planning/**
- Purpose: GSD planning artifacts
- Contains: `config.json`, `codebase/`
- Subdirectories: `codebase/`

## Key File Locations

**Entry Points:**
- `src/main.tsx` - Client entry point (Firebase init, course seeding, React render)
- `src/App.tsx` - Root component with routing (BrowserRouter, Routes)
- `server/index.ts` - Server entry point (Express setup, routes, listen)

**Configuration:**
- `vite.config.ts` - Vite config (React, Tailwind, aliases, test)
- `tsconfig.json` - Client TypeScript config (ES2022, bundler module resolution, path aliases)
- `server/tsconfig.json` - Server TypeScript config
- `eslint.config.js` - ESLint flat config
- `firebase.json` - Firebase CLI config (hosting, firestore rules, functions)
- `firestore.rules` - Firestore security rules
- `.firebaserc` - Firebase project alias

**Core Logic (Client):**
- `src/lib/firebase.ts` - Firebase client initialization + error handling
- `src/lib/learningData.ts` - Progress tracking, streaks, certificates, activity
- `src/lib/quizzes.ts` - Quiz CRUD, attempts, submissions
- `src/lib/ai.ts` - API client for AI features (quiz gen, tutor, summary)
- `src/lib/orders.ts` - Order/purchase related functions
- `src/hooks/useAuth.ts` - Firebase auth state management
- `src/hooks/useDashboard.ts` - Dashboard data aggregation
- `src/hooks/usePurchase.ts` - Purchase flow logic

**Core Logic (Server):**
- `server/firebase.ts` - Firebase Admin SDK initialization
- `server/ai.ts` - Gemini prompt engineering, quiz/tutor/summary generation
- `server/safePay.ts` - SafePay transaction creation, webhook handling
- `server/types.ts` - TypeScript interfaces for server

**Testing:**
- `src/lib/learningData.test.ts` - Unit tests for getWeekDots
- `src/lib/relativeTime.test.ts` - Unit tests for relativeTime
- `src/lib/quizzes.test.ts` - Unit tests for quiz functions (if exists)

**Styling:**
- `src/index.css` - Global styles, Tailwind imports, CSS variables
- Tailwind v4 via `@tailwindcss/vite` plugin

## Naming Conventions

**Files:**
- PascalCase.tsx: React components (`AITutor.tsx`, `CoursePreview.tsx`)
- camelCase.ts: Utilities, services, hooks (`learningData.ts`, `useAuth.ts`)
- camelCase.test.ts: Test files (`learningData.test.ts`, `relativeTime.test.ts`)
- kebab-case: Config files (`vite.config.ts`, `eslint.config.js`)
- UPPERCASE: Important project files (`README.md`, `AGENTS.md`)

**Directories:**
- PascalCase: None (all lowercase)
- kebab-case: None (all lowercase)
- Plural for collections: `components/`, `hooks/`, `lib/`, `pages/`, `contexts/`, `assets/`

**Special Patterns:**
- `index.ts`/`index.tsx`: Not used for barrel exports (direct imports from file path)
- `*.test.ts`: Co-located with source file
- `types.ts`: Shared TypeScript interfaces
- `config.json`: Configuration files

## Where to Add New Code

**New React Component:**
- Primary code: `src/components/NewComponent.tsx`
- Tests: `src/components/NewComponent.test.tsx` (if needed)
- Export: Add to `src/components/index.ts` if barrel file created, or import directly

**New Hook:**
- Implementation: `src/hooks/useNewHook.ts`
- Tests: `src/hooks/useNewHook.test.ts` (if needed)

**New Service/Utility:**
- Implementation: `src/lib/newService.ts`
- Tests: `src/lib/newService.test.ts`

**New Page/Route:**
- Component: `src/pages/NewPage.tsx`
- Route: Add `<Route path="/new-page" element={<NewPage />} />` in `src/App.tsx`

**New Server API Endpoint:**
- Route: Add in `server/index.ts` (app.get/post/put/delete)
- Logic: Add to `server/ai.ts` or `server/safePay.ts` or new file in `server/`
- Types: Add to `server/types.ts` if needed

**New Firebase Operation:**
- Client: Add to `src/lib/learningData.ts` or `src/lib/quizzes.ts` or new file in `src/lib/`
- Server: Add to `server/ai.ts` or `server/safePay.ts` or new file in `server/`

**New Type Definitions:**
- Client: Add to relevant file in `src/lib/` or create `src/types.ts`
- Server: Add to `server/types.ts`

**Styles:**
- Global: `src/index.css` (Tailwind layers, CSS variables)
- Component: Inline Tailwind classes or CSS modules (not currently used)

## Special Directories

**dist/**
- Purpose: Client build output (Vite)
- Source: `npm run build` → `vite build`
- Committed: No (in .gitignore)

**node_modules/**
- Purpose: Installed dependencies
- Source: `npm install`
- Committed: No (in .gitignore)

**.worktrees/**
- Purpose: Git worktrees for parallel feature development
- Source: Created by `git worktree add`
- Committed: No (in .gitignore)

**.superpowers/**
- Purpose: AI brainstorming session artifacts
- Source: Generated by brainstorming tool
- Committed: No (in .gitignore)

**.planning/**
- Purpose: GSD planning artifacts
- Source: Generated by gsd commands
- Committed: Yes (per config.json commit_docs: true)

---

*Structure analysis: 2025-06-06*
*Update when directory structure changes*
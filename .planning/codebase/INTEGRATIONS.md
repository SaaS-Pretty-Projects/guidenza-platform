# External Integrations

**Analysis Date:** 2025-06-06

## APIs & External Services

**AI / LLM:**
- Google Gemini API (gemini-2.0-flash) - AI quiz generation, tutoring, content summarization
  - Integration method: REST API via fetch (server/ai.ts)
  - Auth: Bearer token in `GEMINI_API_KEY` env var
  - Rate limits: Standard Gemini API limits
  - Endpoints used: `generateContent`

**Payment Processing:**
- SafePay - Course payment processing
  - SDK/Client: Direct REST API via fetch (server/safePay.ts)
  - Auth: API key in `SAFEPAY_API_KEY` env var, secret in `SAFEPAY_API_SECRET`, webhook secret in `SAFEPAY_WEBHOOK_SECRET`
  - Endpoints used: `/transactions` (create), webhook verification
  - Base URL: `SAFEPAY_BASE_URL` (default: https://api.safepay.com/v1)

## Data Storage

**Databases:**
- Firestore (Firebase) - Primary data store
  - Client: Firebase client SDK (`firebase` package) via `src/lib/firebase.ts`
  - Server: Firebase Admin SDK (`firebase-admin` package) via `server/firebase.ts`
  - Collections: `users`, `courses`, `orders`, `activity`, `certificates`, `progress`, `quizzes`, `quizAttempts`
  - Security: Firestore rules in `firestore.rules`
  - Database ID: `ai-studio-626d9853-0329-420d-89f0-0de4a7923942` (from firebase-applet-config.json)

**File Storage:**
- Firebase Storage - Available but not currently used in codebase
  - Bucket: `gen-lang-client-0585171045.firebasestorage.app` (from config)

## Authentication & Identity

**Auth Provider:**
- Firebase Auth - Email/password + Google OAuth
  - Client implementation: `src/hooks/useAuth.ts` with `signInWithPopup(GoogleAuthProvider)`
  - Server: Firebase Admin SDK for token verification (if needed)
  - Token storage: Firebase handles auth state persistence
  - Session management: Firebase Auth sessions with automatic refresh

**OAuth Integrations:**
- Google OAuth - Social sign-in
  - Configured in Firebase Console
  - Scopes: email, profile

## Monitoring & Observability

**Error Tracking:**
- Console logging only (development)
- `handleFirestoreError` in `src/lib/firebase.ts` logs structured error info with auth context

**Analytics:**
- None currently implemented

**Logs:**
- Server: stdout/stderr (Express default)
- Client: Browser console

## CI/CD & Deployment

**Hosting:**
- Not yet configured for production
- Client: Vite build output in `dist/`
- Server: TypeScript compiled to `dist/` (or run via `tsx`)

**CI Pipeline:**
- No CI pipeline currently configured
- Local commands: `npm run lint` (tsc --noEmit), `npm run test` (vitest run)

## Environment Configuration

**Development:**
- Required env vars (client): `VITE_API_URL` (default: http://localhost:4000/api/ai), `GEMINI_API_KEY`
- Required env vars (server): `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `GEMINI_API_KEY`, `SAFEPAY_API_KEY`, `SAFEPAY_API_SECRET`, `SAFEPAY_WEBHOOK_SECRET`, `CLIENT_ORIGIN` (default: http://localhost:3000), `PORT` (default: 4000)
- Secrets location: `.env` files (gitignored), Firebase Console for service account

**Staging:**
- Not yet configured

**Production:**
- Not yet configured
- Would use hosting platform environment variables (Vercel, Cloud Run, etc.)

## Webhooks & Callbacks

**Incoming:**
- SafePay webhook - `/api/webhook/safepay` (server/index.ts)
  - Verification: HMAC-SHA256 signature validation via `SAFEPAY_WEBHOOK_SECRET`
  - Events: Payment completion triggers order confirmation and user enrollment

**Outgoing:**
- None currently

---

*Integration audit: 2025-06-06*
*Update when adding/removing external services*
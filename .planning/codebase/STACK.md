# Technology Stack

**Analysis Date:** 2025-06-06

## Languages

**Primary:**
- TypeScript 5.8 - All application code (client + server)
- JavaScript - Config files (vite.config.ts, eslint.config.js)

**Secondary:**
- CSS - Styling via Tailwind CSS v4

## Runtime

**Environment:**
- Node.js 20.x (LTS) - Server runtime for Express API
- Browser (ES2022+) - Client runtime via Vite

**Package Manager:**
- npm 10.x
- Lockfile: `package-lock.json` present

## Frameworks

**Core (Client):**
- React 19 - UI framework
- React Router 7 - Client-side routing
- Vite 6 - Build tool and dev server
- Tailwind CSS 4 - Utility-first CSS framework (via @tailwindcss/vite plugin)

**Core (Server):**
- Express 4 - HTTP server framework
- firebase-admin 13 - Firebase Admin SDK for server-side Firestore/Auth

**Testing:**
- Vitest 4 - Unit/integration test runner
- @testing-library/react - React component testing (not currently used but available)

**Build/Dev:**
- TypeScript 5.8 - Type checking and compilation
- tsx 4 - TypeScript execution for server dev
- ESLint 10 - Linting
- autoprefixer 10 - CSS vendor prefixes

## Key Dependencies

**Critical:**
- firebase 12 - Firebase client SDK (Auth, Firestore)
- @google/genai 1 - Google Generative AI client (Gemini API)
- framer-motion 12 - Animation library
- lucide-react 0.546 - Icon library
- react-helmet-async 3 - Document head management
- react-hot-toast 2 - Toast notifications
- recharts 3 - Charting library
- jspdf 4 - PDF generation
- dotenv 17 - Environment variable loading

**Infrastructure:**
- express 4 - HTTP server
- cors 2 - CORS middleware
- firebase-admin 13 - Server-side Firebase operations

## Configuration

**Environment:**
- Client: `.env` files loaded by Vite (`VITE_API_URL`, `GEMINI_API_KEY`)
- Server: Process environment variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `GEMINI_API_KEY`, `SAFEPAY_API_KEY`, `SAFEPAY_API_SECRET`, `SAFEPAY_WEBHOOK_SECRET`, `CLIENT_ORIGIN`, `PORT`)

**Build:**
- `vite.config.ts` - Vite configuration with React, Tailwind, path aliases
- `tsconfig.json` - TypeScript config with path aliases (`@/*`)
- `server/tsconfig.json` - Server TypeScript config
- `eslint.config.js` - ESLint flat config

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js 20+)
- Firebase project with Firestore and Auth enabled
- Google AI Studio API key for Gemini
- SafePay account for payments (optional - can use test mode)

**Production:**
- Client: Static hosting (Vercel, Netlify, Firebase Hosting)
- Server: Node.js hosting (Cloud Run, Render, Fly.io, Railway)
- Environment variables configured in hosting platform
- Firestore security rules deployed
- Firebase Auth configured with Google OAuth

---

*Stack analysis: 2025-06-06*
*Update after major dependency changes*
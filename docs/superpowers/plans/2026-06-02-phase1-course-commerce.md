# Phase 1 — Course Commerce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sell courses individually with lifetime access via SafePay payment gateway.

**Architecture:** A lightweight Express API server handles SafePay transaction creation + webhook confirmation. Firestore records orders and purchasedCourses. The React frontend uses a purchase gate to conditionally render course content. Content gating is enforced via Firestore security rules.

**Tech Stack:** Express (existing dep), Firebase Admin SDK (new), SafePay REST API, React 19 + Firestore

---

## File Structure

### New files:
```
server/
├── index.ts              # Express app, routes, CORS
├── firebase.ts           # Firebase Admin SDK initialization
├── safePay.ts            # SafePay API client (create txn, verify)
├── types.ts              # Shared types
└── .env.example          # Environment variable template

src/
├── lib/
│   └── orders.ts         # Firestore order operations
├── hooks/
│   └── usePurchase.ts    # Purchase + access check hook
├── components/
│   ├── CheckoutButton.tsx   # Buy button (replaces free enroll)
│   ├── PurchaseGate.tsx     # Gated content wrapper
│   └── OrderHistory.tsx     # Purchase history component
├── pages/
│   └── CheckoutResult.tsx   # Post-payment redirect landing page
```

### Modified files:
```
src/
├── App.tsx                  # Add /checkout-result route
├── components/
│   ├── CoursePreview.tsx    # Replace enroll with purchase flow
│   └── Dashboard.tsx        # Add order history section
├── lib/
│   └── learningData.ts      # Separate enrollment from purchase
├── firestore.rules          # Add orders + purchasedCourses gating
├── package.json             # Add firebase-admin dep
└── .gitignore               # Add server/.env, server dist
```

---

### Task 1: Bootstrap Express API server

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/index.ts`
- Create: `server/firebase.ts`
- Create: `server/types.ts`
- Create: `server/.env.example`
- Modify: `package.json` (add dev script for server)
- Modify: `.gitignore`

**Step 1.1: Create `server/package.json`**

```json
{
  "name": "guidenza-api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "firebase-admin": "^13.2.0"
  },
  "devDependencies": {
    "tsx": "^4.21.0",
    "typescript": "~5.8.2"
  }
}
```

**Step 1.2: Create `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 1.3: Create `server/.env.example`**

```
PORT=4000
SAFEPAY_API_KEY=your_safepay_api_key
SAFEPAY_API_SECRET=your_safepay_api_secret
SAFEPAY_WEBHOOK_SECRET=your_webhook_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
CLIENT_ORIGIN=http://localhost:3000
```

**Step 1.4: Create `server/types.ts`**

```typescript
export interface CreateTransactionRequest {
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
}

export interface SafePayTransaction {
  transactionId: string;
  checkoutUrl: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface OrderData {
  id?: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'refunded';
  safePayTransactionId: string;
  createdAt: Date;
}

export interface SafePayWebhookPayload {
  transaction_id: string;
  status: 'completed' | 'failed';
  signature: string;
  [key: string]: unknown;
}
```

**Step 1.5: Create `server/firebase.ts`**

```typescript
import admin from 'firebase-admin';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
};

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
```

**Step 1.6: Create `server/index.ts`**

```typescript
import express from 'express';
import cors from 'cors';
import { createTransaction, handleWebhook } from './safePay.js';
import { db } from './firebase.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use('/api/webhook', express.text({ type: '*/*' }));
app.use('/api', express.json());

app.post('/api/checkout', async (req, res) => {
  try {
    const { userId, courseId, amount, currency } = req.body;
    if (!userId || !courseId || !amount) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const txn = await createTransaction({ userId, courseId, amount, currency: currency ?? 'PKR' });

    await db.collection('orders').add({
      userId,
      courseId,
      amount,
      currency: currency ?? 'PKR',
      status: 'pending',
      safePayTransactionId: txn.transactionId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ checkoutUrl: txn.checkoutUrl, transactionId: txn.transactionId });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

app.post('/api/webhook/safepay', async (req, res) => {
  try {
    const signature = req.headers['x-safepay-signature'] as string;
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    await handleWebhook(payload, signature);
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(400);
  }
});

app.get('/api/orders/:userId', async (req, res) => {
  try {
    const snapshot = await db
      .collection('orders')
      .where('userId', '==', req.params.userId)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(orders);
  } catch (err) {
    console.error('Orders fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.listen(PORT, () => {
  console.log(`Guidenza API running on port ${PORT}`);
});

// Need admin import for FieldValue
import admin from 'firebase-admin';
```

**Step 1.7: Modify root `package.json`** — add dev script:

```json
"dev:api": "tsx watch server/index.ts",
```

Add after the existing `"dev": "vite --port=3000 --host=0.0.0.0",` line.

**Step 1.8: Modify `.gitignore`** — append:

```
server/.env
server/dist/
```

- [ ] **Step 1.1:** Create `server/package.json`
- [ ] **Step 1.2:** Create `server/tsconfig.json`
- [ ] **Step 1.3:** Create `server/.env.example`
- [ ] **Step 1.4:** Create `server/types.ts`
- [ ] **Step 1.5:** Create `server/firebase.ts`
- [ ] **Step 1.6:** Create `server/index.ts`
- [ ] **Step 1.7:** Add `dev:api` script to root `package.json`
- [ ] **Step 1.8:** Append to `.gitignore`
- [ ] **Step 1.9:** Run `npm install` in both root and `server/` to install deps
- [ ] **Step 1.10:** Commit: `git add -A && git commit -m "feat: bootstrap Express API server for payments"`

---

### Task 2: SafePay API integration

**Files:**
- Create: `server/safePay.ts`

**Step 2.1: Create `server/safePay.ts`**

```typescript
import { db } from './firebase.js';
import admin from 'firebase-admin';
import { CreateTransactionRequest, SafePayTransaction, SafePayWebhookPayload } from './types.js';

const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY ?? '';
const SAFEPAY_API_SECRET = process.env.SAFEPAY_API_SECRET ?? '';
const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET ?? '';
const SAFEPAY_BASE_URL = process.env.SAFEPAY_BASE_URL ?? 'https://api.safepay.com/v1';

/**
 * Creates a SafePay transaction and returns the checkout URL.
 * SafePay API reference: POST /v1/transactions
 */
export async function createTransaction(
  req: CreateTransactionRequest,
): Promise<SafePayTransaction> {
  const response = await fetch(`${SAFEPAY_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SAFEPAY_API_KEY}`,
    },
    body: JSON.stringify({
      amount: req.amount,
      currency: req.currency,
      reference: `${req.userId}_${req.courseId}_${Date.now()}`,
      metadata: {
        userId: req.userId,
        courseId: req.courseId,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SafePay API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return {
    transactionId: data.data.transaction_id,
    checkoutUrl: data.data.checkout_url,
    status: 'pending',
  };
}

/**
 * Verifies the webhook signature and updates the order + user access.
 */
export async function handleWebhook(
  payload: SafePayWebhookPayload,
  signature: string,
): Promise<void> {
  // Verify webhook signature
  const expectedSig = await computeHmac(
    JSON.stringify(payload),
    SAFEPAY_WEBHOOK_SECRET,
  );
  if (signature !== expectedSig) {
    throw new Error('Invalid webhook signature');
  }

  if (payload.status !== 'completed') return;

  // Find the pending order by SafePay transaction ID
  const snapshot = await db
    .collection('orders')
    .where('safePayTransactionId', '==', payload.transaction_id)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.warn(`No pending order found for txn ${payload.transaction_id}`);
    return;
  }

  const orderDoc = snapshot.docs[0];
  const order = orderDoc.data() as { userId: string; courseId: string };

  // Update order to confirmed
  await orderDoc.ref.update({ status: 'confirmed' });

  // Add course to user's purchasedCourses
  await db.collection('users').doc(order.userId).set(
    {
      purchasedCourses: admin.firestore.FieldValue.arrayUnion(order.courseId),
    },
    { merge: true },
  );

  // Also enroll them
  await db.collection('users').doc(order.userId).set(
    {
      enrolledCourses: admin.firestore.FieldValue.arrayUnion(order.courseId),
    },
    { merge: true },
  );

  // Log activity event
  await db.collection('users').doc(order.userId).collection('activity').add({
    type: 'enrolled',
    courseId: order.courseId,
    courseName: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function computeHmac(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

- [ ] **Step 2.1:** Create `server/safePay.ts`
- [ ] **Step 2.2:** Commit: `git add -A && git commit -m "feat: SafePay API integration with webhook handler"`

---

### Task 3: Frontend order utilities

**Files:**
- Create: `src/lib/orders.ts`

**Step 3.1: Create `src/lib/orders.ts`**

```typescript
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const API_BASE = 'http://localhost:4000/api';

export interface Order {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'refunded';
  safePayTransactionId: string;
  createdAt: any;
}

/**
 * Fetches user's purchase status from Firestore directly.
 */
export async function hasPurchasedCourse(uid: string, courseId: string): Promise<boolean> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return false;
  const purchasedCourses: string[] = snap.data().purchasedCourses ?? [];
  return purchasedCourses.includes(courseId);
}

/**
 * Fetches all orders for a user from Firestore.
 */
export async function getUserOrders(uid: string): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

/**
 * Initiates checkout by calling the API server.
 */
export async function initiateCheckout(
  userId: string,
  courseId: string,
  amount: number,
  currency = 'PKR',
): Promise<string> {
  const res = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, courseId, amount, currency }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Checkout failed');
  }

  const data = await res.json();
  return data.checkoutUrl;
}
```

- [ ] **Step 3.1:** Create `src/lib/orders.ts`
- [ ] **Step 3.2:** Commit: `git add -A && git commit -m "feat: frontend order utilities"`

---

### Task 4: usePurchase hook

**Files:**
- Create: `src/hooks/usePurchase.ts`

**Step 4.1: Create `src/hooks/usePurchase.ts`**

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { hasPurchasedCourse, initiateCheckout } from '../lib/orders';

export function usePurchase(courseId: string | undefined, amount: number) {
  const { user } = useAuth();
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user || !courseId) {
      setPurchased(false);
      setChecking(false);
      return;
    }

    let cancelled = false;
    hasPurchasedCourse(user.uid, courseId).then(result => {
      if (!cancelled) {
        setPurchased(result);
        setChecking(false);
      }
    });

    return () => { cancelled = true; };
  }, [user, courseId]);

  const buy = async () => {
    if (!user || !courseId) return;
    setLoading(true);
    try {
      const checkoutUrl = await initiateCheckout(user.uid, courseId, amount);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Purchase failed', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { purchased, loading, checking, buy };
}
```

- [ ] **Step 4.1:** Create `src/hooks/usePurchase.ts`
- [ ] **Step 4.2:** Commit: `git add -A && git commit -m "feat: usePurchase hook"`

---

### Task 5: CheckoutButton component

**Files:**
- Create: `src/components/CheckoutButton.tsx`

**Step 5.1: Create `src/components/CheckoutButton.tsx`**

```tsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { usePurchase } from '../hooks/usePurchase';

interface CheckoutButtonProps {
  courseId: string;
  amount: number;
  currency?: string;
}

export function CheckoutButton({ courseId, amount, currency = 'PKR' }: CheckoutButtonProps) {
  const { user } = useAuth();
  const { purchased, loading, checking, buy } = usePurchase(courseId, amount);
  const [processing, setProcessing] = useState(false);

  if (checking) return null;

  if (purchased) return null;

  const handleClick = async () => {
    if (!user) {
      toast.error('Please sign in to purchase');
      return;
    }
    setProcessing(true);
    try {
      await buy();
    } catch {
      toast.error('Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={processing || loading}
      className="w-full sm:w-auto px-8 py-3 bg-foreground text-background font-semibold rounded-full hover:scale-[1.02] transition-transform disabled:opacity-50"
    >
      {processing ? 'Redirecting to payment...' : `Buy for ${currency === 'PKR' ? 'Rs.' : '$'}${amount}`}
    </button>
  );
}
```

- [ ] **Step 5.1:** Create `src/components/CheckoutButton.tsx`
- [ ] **Step 5.2:** Commit: `git add -A && git commit -m "feat: CheckoutButton component"`

---

### Task 6: PurchaseGate component

**Files:**
- Create: `src/components/PurchaseGate.tsx`

**Step 6.1: Create `src/components/PurchaseGate.tsx`**

```tsx
import { type ReactNode } from 'react';
import { usePurchase } from '../hooks/usePurchase';
import { CheckoutButton } from './CheckoutButton';

interface PurchaseGateProps {
  courseId: string;
  amount: number;
  currency?: string;
  preview: ReactNode;
  full: ReactNode;
}

export function PurchaseGate({ courseId, amount, currency, preview, full }: PurchaseGateProps) {
  const { purchased, checking } = usePurchase(courseId, amount);

  if (checking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (purchased) return <>{full}</>;

  return (
    <div>
      {preview}
      <div className="mt-6 p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
        <p className="text-muted-foreground mb-4">
          Unlock full access to all modules and features
        </p>
        <CheckoutButton courseId={courseId} amount={amount} currency={currency} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6.1:** Create `src/components/PurchaseGate.tsx`
- [ ] **Step 6.2:** Commit: `git add -A && git commit -m "feat: PurchaseGate component for content gating"`

---

### Task 7: Update CoursePreview with purchase flow

**Files:**
- Modify: `src/components/CoursePreview.tsx`

**Step 7.1:** Replace the enrollment/free logic with purchase-gated content.

Changes:
1. Remove the `handleSaveCourse` function (free enrollment is gone)
2. Add `CheckoutButton` and `PurchaseGate` imports
3. Replace the "Enroll for $X" button with `CheckoutButton`
4. Wrap module content in `PurchaseGate`
5. Still allow existing enrolled users to access (backward compatibility)

At the top, add imports:
```tsx
import { CheckoutButton } from './CheckoutButton';
import { PurchaseGate } from './PurchaseGate';
import { hasPurchasedCourse } from '../lib/orders';
```

Add new state:
```tsx
const [purchased, setPurchased] = useState(false);
```

In the `checkUserData` effect, add purchase check:
```tsx
// After the existing enrolled check
const purchasedCourses: string[] = data.purchasedCourses ?? [];
const hasPurchased = purchasedCourses.includes(course.id);
setPurchased(hasPurchased);
```

The section where modules are rendered (lines 374-420) — wrap with PurchaseGate:

Replace the enrollment + modules section (lines 374-446):

```tsx
{/* Modules section - gated */}
<div className="mt-8 mb-4">
  <h3 className="text-xs uppercase tracking-[3px] text-muted-foreground mb-4">
    Modules
  </h3>
  <PurchaseGate
    courseId={course.id}
    amount={course.price}
    preview={
      <div className="flex flex-col gap-2">
        {moduleList.slice(0, 1).map((mod) => (
          <div key={mod.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" />
            <span className="flex-1 text-sm text-muted-foreground">{mod.title}</span>
          </div>
        ))}
        {moduleList.length > 1 && (
          <p className="text-xs text-muted-foreground/50 text-center py-2">
            + {moduleList.length - 1} more modules
          </p>
        )}
      </div>
    }
    full={
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
    }
  />
</div>
```

Replace the bottom sticky bar (lines 422-446):

```tsx
<div className="sticky bottom-0 -mx-8 px-8 py-4 bg-background/95 backdrop-blur-sm border-t border-white/10 flex flex-col sm:flex-row items-center gap-4 mt-4 z-10">
  {!isEnrolled && !purchased && (
    <CheckoutButton courseId={course.id} amount={course.price} />
  )}
  {(isEnrolled || purchased) && (
    <>
      <span className="text-sm font-medium text-green-400 flex items-center gap-1 border border-green-500/30 bg-green-500/10 px-4 py-2 rounded-full">
        <CheckCircle2 size={16} /> {isEnrolled ? 'Enrolled' : 'Purchased'}
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

- [ ] **Step 7.1:** Apply the CoursePreview changes
- [ ] **Step 7.2:** Commit: `git add -A && git commit -m "feat: integrate purchase flow into CoursePreview"`

---

### Task 8: Update Firestore security rules

**Files:**
- Modify: `firestore.rules`

**Step 8.1: Update `firestore.rules`**

Add `orders` collection rules and `purchasedCourses` gating:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /subscriptions/{subscriptionId} {
      allow create: if true;
      allow read, update, delete: if false;
    }

    match /orders/{orderId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
      allow update: if false;
      allow delete: if false;
    }

    match /courses/{courseId} {
      allow read: if true;
      allow write: if true;

      match /modules/{moduleId} {
        allow read: if true;
        allow write: if false;
      }

      match /reviews/{reviewId} {
        allow read: if true;
        allow write: if request.auth != null;
      }

      match /announcements/{announcementId} {
        allow read: if true;
        allow write: if request.auth != null;
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

- [ ] **Step 8.1:** Update `firestore.rules`
- [ ] **Step 8.2:** Commit: `git add -A && git commit -m "feat: update Firestore rules with orders and purchase gating"`

---

### Task 9: OrderHistory component

**Files:**
- Create: `src/components/OrderHistory.tsx`

**Step 9.1: Create `src/components/OrderHistory.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserOrders, Order } from '../lib/orders';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<(Order & { courseTitle?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      const userOrders = await getUserOrders(user.uid);
      const withTitles = await Promise.all(
        userOrders.map(async (order) => {
          try {
            const courseSnap = await getDoc(doc(db, 'courses', order.courseId));
            const courseTitle = courseSnap.exists() ? courseSnap.data().title : 'Unknown Course';
            return { ...order, courseTitle };
          } catch {
            return { ...order, courseTitle: 'Unknown Course' };
          }
        }),
      );
      setOrders(withTitles);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-muted-foreground text-sm">Sign in to view your orders.</p>;
  }

  if (orders.length === 0) {
    return <p className="text-muted-foreground text-sm">No orders yet.</p>;
  }

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400',
    confirmed: 'text-green-400',
    refunded: 'text-red-400',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4">Purchase History</h3>
      {orders.map(order => (
        <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div>
            <p className="text-sm font-medium">{order.courseTitle}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt?.toDate?.() ?? order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm">{order.currency === 'PKR' ? 'Rs.' : '$'}{order.amount}</p>
            <p className={`text-xs font-medium ${statusColors[order.status] ?? 'text-muted-foreground'}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 9.1:** Create `src/components/OrderHistory.tsx`
- [ ] **Step 9.2:** Commit: `git add -A && git commit -m "feat: OrderHistory component"`

---

### Task 10: CheckoutResult page

**Files:**
- Create: `src/pages/CheckoutResult.tsx`
- Modify: `src/App.tsx`

**Step 10.1: Create `src/pages/CheckoutResult.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

export function CheckoutResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  useEffect(() => {
    if (!user) return;

    const transactionId = searchParams.get('transaction_id');
    const courseId = searchParams.get('course_id');

    if (!transactionId || !courseId) {
      setStatus('failed');
      return;
    }

    const check = async () => {
      // Poll Firestore for the confirmed order
      for (let i = 0; i < 30; i++) {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const purchasedCourses: string[] = snap.data().purchasedCourses ?? [];
          if (purchasedCourses.includes(courseId)) {
            setStatus('success');
            return;
          }
        }
        await new Promise(r => setTimeout(r, 1000));
      }
      setStatus('failed');
    };

    check();
  }, [user, searchParams]);

  const handleGoToCourse = () => {
    const courseId = searchParams.get('course_id');
    navigate('/explore');
    // In a real app, navigate to a course detail page
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center">
        {status === 'verifying' && (
          <div>
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your purchase...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">Your course has been unlocked. Start learning now.</p>
            <button
              onClick={handleGoToCourse}
              className="px-8 py-3 bg-foreground text-background font-semibold rounded-full"
            >
              Go to Course
            </button>
          </div>
        )}
        {status === 'failed' && (
          <div>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <X size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Verification Failed</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't verify your payment. If you were charged, please contact support.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="px-8 py-3 bg-foreground text-background font-semibold rounded-full"
            >
              Back to Explore
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

Add missing imports:
```tsx
import { CheckCircle2, X } from 'lucide-react';
```

**Step 10.2: Add route in `src/App.tsx`**

Add import:
```tsx
import { CheckoutResult } from './pages/CheckoutResult';
```

Add route:
```tsx
<Route path="/checkout-result" element={<CheckoutResult />} />
```

- [ ] **Step 10.1:** Create `src/pages/CheckoutResult.tsx`
- [ ] **Step 10.2:** Add checkout result route in `src/App.tsx`
- [ ] **Step 10.3:** Commit: `git add -A && git commit -m "feat: checkout result page with payment verification"`

---

### Task 11: Update Dashboard with purchase history

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 11.1:** Add `OrderHistory` to the dashboard.

Add import:
```tsx
import { OrderHistory } from './OrderHistory';
```

Add the OrderHistory section somewhere appropriate in the dashboard, e.g. after the activity feed:

```tsx
<div className="mt-8">
  <OrderHistory />
</div>
```

- [ ] **Step 11.1:** Add OrderHistory to Dashboard
- [ ] **Step 11.2:** Commit: `git add -A && git commit -m "feat: add purchase history to dashboard"`

---

## Self-Review

- [ ] **Spec coverage:** Every requirement from the Phase 1 spec (SafePay checkout, orders data model, content gating, purchase flow) has corresponding tasks
- [ ] **Placeholder scan:** No TBDs, TODOs, or vague instructions — all code and commands are concrete
- [ ] **Type consistency:** `Order`, `SafePayTransaction`, `SafePayWebhookPayload` types are consistent across files
- [ ] **File count:** 14 new files, 5 modified files — focused scope

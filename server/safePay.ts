import { db } from './firebase.js';
import admin from 'firebase-admin';
import { CreateTransactionRequest, SafePayTransaction, SafePayWebhookPayload } from './types.js';

const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY ?? '';
const SAFEPAY_API_SECRET = process.env.SAFEPAY_API_SECRET ?? '';
const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET ?? '';
const SAFEPAY_BASE_URL = process.env.SAFEPAY_BASE_URL ?? 'https://api.safepay.com/v1';

/**
 * Creates a SafePay transaction and returns the checkout URL.
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

/** Helper: update user's custom claims with purchased/enrolled courses */
async function updateUserCourseClaims(userId: string, courseId: string): Promise<void> {
  try {
    // Get current user record to read existing claims
    const userRecord = await admin.auth().getUser(userId);
    const currentClaims = userRecord.customClaims || {};
    const purchased = Array.from(new Set([...(currentClaims.purchasedCourses || []), courseId]));
    const enrolled = Array.from(new Set([...(currentClaims.enrolledCourses || []), courseId]));
    await admin.auth().setCustomUserClaims(userId, {
      ...currentClaims,
      purchasedCourses: purchased,
      enrolledCourses: enrolled,
    });
  } catch (err) {
    console.error(`Failed to update custom claims for user ${userId}:`, err);
  }
}

/**
 * Verifies the webhook signature and updates the order + user access.
 */
export async function handleWebhook(
  payload: SafePayWebhookPayload,
  signature: string,
  rawBody?: string,
): Promise<void> {
  const bodyForHmac = rawBody ?? JSON.stringify(payload);
  const expectedSig = await computeHmac(bodyForHmac, SAFEPAY_WEBHOOK_SECRET);
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

  // Add course to user's purchasedCourses (Firestore)
  await db.collection('users').doc(order.userId).set(
    {
      purchasedCourses: admin.firestore.FieldValue.arrayUnion(order.courseId),
    },
    { merge: true },
  );

  // Also enroll them (Firestore)
  await db.collection('users').doc(order.userId).set(
    {
      enrolledCourses: admin.firestore.FieldValue.arrayUnion(order.courseId),
    },
    { merge: true },
  );

  // Update Auth custom claims for Firestore rules optimization (no get() calls)
  await updateUserCourseClaims(order.userId, order.courseId);

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

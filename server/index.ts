import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { db } from './firebase.js';
import { createTransaction, handleWebhook } from './safePay.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3000';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use('/api/webhook', express.text({ type: '*/*' }));
app.use('/api', express.json());

// Auth middleware: verify Firebase ID token
async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const idToken = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.auth = decoded;
    next();
  } catch (err) {
    console.error('Auth verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Protected checkout endpoint - userId comes from auth token, not request body
app.post('/api/checkout', verifyAuth, async (req, res) => {
  try {
    const auth = req.auth;
    const { courseId, amount, currency } = req.body;
    if (!courseId || !amount) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const userId = auth.uid;

    // Create SafePay transaction
    const txn = await createTransaction({ userId, courseId, amount, currency: currency ?? 'PKR' });

    // Create pending order
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
    const rawBody = req.body as string;
    const payload = JSON.parse(rawBody);
    await handleWebhook(payload, signature, rawBody);
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(400);
  }
});

// Protected orders endpoint - user can only see their own orders
app.get('/api/orders', verifyAuth, async (req, res) => {
  try {
    const auth = req.auth;
    const snapshot = await db
      .collection('orders')
      .where('userId', '==', auth.uid)
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

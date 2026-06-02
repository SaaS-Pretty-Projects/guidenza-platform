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

app.post('/api/checkout', async (req, res) => {
  try {
    const { userId, courseId, amount, currency } = req.body;
    if (!userId || !courseId || !amount) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

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

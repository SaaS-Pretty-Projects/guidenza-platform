import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
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

    // Create pending order
    const orderRef = await db.collection('orders').add({
      userId,
      courseId,
      amount,
      currency: currency ?? 'PKR',
      status: 'pending',
      safePayTransactionId: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Return a checkout URL pattern (SafePay will be integrated in Task 2)
    res.json({
      checkoutUrl: `${CLIENT_ORIGIN}/checkout-result?order_id=${orderRef.id}&course_id=${courseId}`,
      transactionId: orderRef.id,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

app.post('/api/webhook/safepay', async (req, res) => {
  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('Webhook received:', payload);
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

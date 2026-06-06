import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { db } from './firebase.js';
import { createTransaction, handleWebhook } from './safePay.js';
import { generateAQuiz, askTutor, generateSummary, getModuleContent } from './ai.js';

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

// Helper: check if user has access to a course (purchased or enrolled)
async function requireCourseAccess(auth, courseId) {
  const purchased = auth.purchasedCourses ?? [];
  const enrolled = auth.enrolledCourses ?? [];
  return purchased.includes(courseId) || enrolled.includes(courseId);
}

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
    const rawBody = req.body as string;
    const payload = JSON.parse(rawBody);
    await handleWebhook(payload, signature, rawBody);
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

// -- AI Routes (protected) --

app.post('/api/ai/generate-quiz', verifyAuth, async (req, res) => {
  try {
    const auth = req.auth;
    const { courseId, moduleId, difficulty, questionCount } = req.body;
    if (!courseId || !moduleId) {
      res.status(400).json({ error: 'Missing courseId or moduleId' });
      return;
    }

    // Authorization: ensure user has access to this course
    const hasAccess = await requireCourseAccess(auth, courseId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    const mod = await getModuleContent(courseId, moduleId);
    const quiz = await generateAQuiz({
      moduleTitle: mod.title,
      moduleContent: mod.content,
      difficulty: difficulty ?? 'medium',
      questionCount: questionCount ?? 5,
    });
    res.json(quiz);
  } catch (err) {
    console.error('AI quiz generation error:', err);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

app.post('/api/ai/tutor', verifyAuth, async (req, res) => {
  try {
    const auth = req.auth;
    const { courseId, moduleId, question } = req.body;
    if (!courseId || !moduleId || !question) {
      res.status(400).json({ error: 'Missing courseId, moduleId, or question' });
      return;
    }

    // Authorization
    const hasAccess = await requireCourseAccess(auth, courseId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    const mod = await getModuleContent(courseId, moduleId);
    const answer = await askTutor(mod.title, mod.content, question);
    res.json({ answer });
  } catch (err) {
    console.error('AI tutor error:', err);
    res.status(500).json({ error: 'Failed to get tutor response' });
  }
});

app.get('/api/ai/summarize/:courseId/:moduleId', verifyAuth, async (req, res) => {
  try {
    const auth = req.auth;
    const { courseId, moduleId } = req.params;

    // Authorization
    const hasAccess = await requireCourseAccess(auth, courseId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    const mod = await getModuleContent(courseId, moduleId);
    const summary = await generateSummary(mod.title, mod.content);
    res.json({ summary, moduleTitle: mod.title });
  } catch (err) {
    console.error('AI summary error:', err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.listen(PORT, () => {
  console.log(`Guidenza API running on port ${PORT}`);
});

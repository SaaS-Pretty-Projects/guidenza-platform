/**
 * Guidenza API Worker
 * Handles: SafePay payments, IPN webhooks, email notifications, rate limiting
 */

export interface Env {
  SAFEPAY_API_KEY: string;
  SAFEPAY_SECRET: string;
  SAFEPAY_WEBHOOK_SECRET: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_SERVICE_ACCOUNT: string;
  SMTP_HOST: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  RATE_LIMIT: KVNamespace;
  INTERNAL_API_SECRET: string;
}

interface CreditPack {
  id: string;
  credits: number;
  price: number;
  label: string;
}

const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_500', credits: 500, price: 5, label: 'Starter' },
  { id: 'pack_2500', credits: 2500, price: 20, label: 'Growth' },
  { id: 'pack_5000', credits: 5000, price: 35, label: 'Pro' },
  { id: 'pack_15000', credits: 15000, price: 90, label: 'Enterprise' },
];

const SUBSCRIPTION_PRICES: Record<string, number> = {
  pro: 1900, // cents
  enterprise: 4900,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Rate limit AI-proxy endpoints (if added later)
      if (path.startsWith('/api/ai/')) {
        const uid = url.searchParams.get('uid');
        if (!uid) return json({ error: 'Missing uid' }, 400);
        const limited = await checkRateLimit(env, uid, path);
        if (limited) return json({ error: 'Rate limit exceeded. Try again tomorrow.' }, 429);
      }

      switch (path) {
        case '/api/checkout':
          return handleCheckout(request, env, url);
        case '/api/subscribe':
          return handleSubscribe(request, env, url);
        case '/api/webhook/safepay':
          return handleIPN(request, env);
        case '/api/send-email':
          return handleEmail(request, env);
        case '/api/redeem-coupon':
          return handleRedeemCoupon(request, env);
        case '/api/health':
          return json({ status: 'ok', timestamp: Date.now() });
        default:
          return json({ error: 'Not found' }, 404);
      }
    } catch (err) {
      console.error('Worker error:', err);
      return json({ error: 'Internal server error' }, 500);
    }
  },
};

async function handleCheckout(request: Request, env: Env, url: URL): Promise<Response> {
  const packId = url.searchParams.get('pack');
  const uid = url.searchParams.get('uid');

  if (!packId || !uid) return json({ error: 'Missing pack or uid' }, 400);

  const pack = CREDIT_PACKS.find(p => p.id === packId);
  if (!pack) return json({ error: 'Invalid pack' }, 400);

  // Create SafePay checkout session
  const session = await createSafepaySession(env, {
    amount: pack.price * 100,
    currency: 'USD',
    metadata: { uid, packId, credits: pack.credits, type: 'credit_purchase' },
    description: `${pack.label} Pack - ${pack.credits} credits`,
  });

  return json({ checkoutUrl: session.url, sessionId: session.id });
}

async function handleSubscribe(request: Request, env: Env, url: URL): Promise<Response> {
  const tier = url.searchParams.get('tier');
  const uid = url.searchParams.get('uid');

  if (!tier || !uid) return json({ error: 'Missing tier or uid' }, 400);

  const price = SUBSCRIPTION_PRICES[tier];
  if (!price) return json({ error: 'Invalid tier' }, 400);

  const session = await createSafepaySession(env, {
    amount: price,
    currency: 'USD',
    metadata: { uid, tier, type: 'subscription' },
    description: `Guidenza ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
    recurring: true,
  });

  return json({ checkoutUrl: session.url, sessionId: session.id });
}

async function handleIPN(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const body = await request.text();
  const signature = request.headers.get('x-safepay-signature') || '';

  // Verify webhook signature
  const isValid = await verifySignature(body, signature, env.SAFEPAY_WEBHOOK_SECRET);
  if (!isValid) return json({ error: 'Invalid signature' }, 401);

  const event = JSON.parse(body);

  if (event.type === 'payment.success') {
    const { uid, type, credits, tier, packId } = event.data.metadata;

    if (type === 'credit_purchase') {
      await updateFirebaseCredits(env, uid, credits);
      await sendTransactionalEmail(env, event.data.customer_email, {
        subject: `Credits Added - ${credits} credits`,
        body: `Your purchase of ${credits} credits has been confirmed. They are now available in your Guidenza account.`,
      });
    } else if (type === 'subscription') {
      await updateFirebaseTier(env, uid, tier);
      await sendTransactionalEmail(env, event.data.customer_email, {
        subject: `Welcome to Guidenza ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`,
        body: `Your ${tier} subscription is now active. Enjoy unlimited access to all Guidenza features.`,
      });
    }
  }

  return json({ received: true });
}

async function handleEmail(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader !== `Bearer ${env.INTERNAL_API_SECRET}`) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const { to, subject, body } = await request.json() as { to: string; subject: string; body: string };
  await sendTransactionalEmail(env, to, { subject, body });
  return json({ sent: true });
}

async function handleRedeemCoupon(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const { code, uid } = await request.json() as { code: string; uid: string };
  if (!code || !uid) return json({ error: 'Missing code or uid' }, 400);

  const token = await getFirebaseToken(env);
  const projectId = env.FIREBASE_PROJECT_ID;
  const couponPath = `projects/${projectId}/databases/(default)/documents/coupons/${code.toUpperCase()}`;

  // Read coupon
  const couponRes = await fetch(
    `https://firestore.googleapis.com/v1/${couponPath}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  if (!couponRes.ok) return json({ error: 'Invalid coupon code' }, 404);

  const couponDoc = await couponRes.json() as Record<string, any>;
  const fields = couponDoc.fields || {};

  const usedByArr: string[] = (fields.usedBy?.arrayValue?.values || []).map((v: any) => v.stringValue);
  if (usedByArr.includes(uid)) return json({ error: 'You have already used this coupon' }, 400);

  const usedCount = parseInt(fields.usedCount?.integerValue || '0', 10);
  const maxUses = fields.maxUses ? parseInt(fields.maxUses.integerValue || '0', 10) : 0;
  if (maxUses && usedCount >= maxUses) return json({ error: 'Coupon has reached its usage limit' }, 400);

  const expiresAt = fields.expiresAt?.stringValue;
  if (expiresAt && new Date(expiresAt) < new Date()) return json({ error: 'Coupon has expired' }, 400);

  const credits = parseInt(fields.credits?.integerValue || '0', 10);
  if (credits <= 0) return json({ error: 'Invalid coupon' }, 400);

  // Atomic commit: mark coupon as used + increment user credits
  const userPath = `projects/${projectId}/databases/(default)/documents/users/${uid}`;
  const updatedUsedBy = [...usedByArr, uid].map(v => ({ stringValue: v }));

  const commitRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: couponPath,
              fields: {
                ...fields,
                usedBy: { arrayValue: { values: updatedUsedBy } },
                usedCount: { integerValue: String(usedCount + 1) }
              }
            },
            currentDocument: { updateTime: couponDoc.updateTime }
          },
          {
            transform: {
              document: userPath,
              fieldTransforms: [{
                fieldPath: 'credits',
                increment: { integerValue: credits.toString() }
              }]
            }
          }
        ]
      })
    }
  );

  if (!commitRes.ok) {
    const err = await commitRes.text();
    console.error('Coupon commit failed:', err);
    return json({ error: 'Coupon redemption failed, please try again' }, 409);
  }

  return json({ success: true, credits });
}

// --- Helpers ---

async function createSafepaySession(env: Env, params: {
  amount: number;
  currency: string;
  metadata: Record<string, any>;
  description: string;
  recurring?: boolean;
}): Promise<{ url: string; id: string }> {
  const response = await fetch('https://api.getsafepay.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.SAFEPAY_API_KEY}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
      description: params.description,
      success_url: 'https://guidenza.com/credits?status=success',
      cancel_url: 'https://guidenza.com/credits?status=cancelled',
    }),
  });

  if (!response.ok) throw new Error(`SafePay API error: ${response.status}`);
  return response.json();
}

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const sigBytes = hexToBytes(signature);
  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(body));
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function updateFirebaseCredits(env: Env, uid: string, credits: number): Promise<void> {
  const token = await getFirebaseToken(env);
  const docPath = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        writes: [{
          transform: {
            document: docPath,
            fieldTransforms: [{
              fieldPath: 'credits',
              increment: { integerValue: credits.toString() }
            }]
          }
        }]
      })
    }
  );
}

async function updateFirebaseTier(env: Env, uid: string, tier: string): Promise<void> {
  const token = await getFirebaseToken(env);
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=tier`,
    {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: { tier: { stringValue: tier } }
      })
    }
  );
}

async function getFirebaseToken(env: Env): Promise<string> {
  // In production, use service account JWT to get access token
  // For now, return the service account key directly
  return env.FIREBASE_SERVICE_ACCOUNT;
}

async function sendTransactionalEmail(env: Env, to: string, params: { subject: string; body: string }): Promise<void> {
  // SMTP via MailChannels (free on Cloudflare Workers)
  await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@guidenza.com', name: 'Guidenza' },
      subject: params.subject,
      content: [{
        type: 'text/html',
        value: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #1a1a1a; margin-bottom: 16px;">${params.subject}</h2>
            <p style="color: #4a4a4a; line-height: 1.6;">${params.body}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="color: #999; font-size: 12px;">Guidenza &mdash; Expert Learning Platform</p>
          </div>
        `
      }]
    })
  });
}

const RATE_LIMITS: Record<string, number> = {
  '/api/ai/tutor': 10,
  '/api/ai/quiz': 5,
  '/api/ai/study-plan': 3,
};

async function checkRateLimit(env: Env, uid: string, path: string): Promise<boolean> {
  const limit = RATE_LIMITS[path] || 10;
  const today = new Date().toISOString().split('T')[0];
  const key = `rl:${uid}:${path}:${today}`;

  const current = parseInt(await env.RATE_LIMIT.get(key) || '0', 10);
  if (current >= limit) return true;

  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: 86400 });
  return false;
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

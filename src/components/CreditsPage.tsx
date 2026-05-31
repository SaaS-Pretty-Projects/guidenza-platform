import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../contexts/CreditsContext';
import { Zap, CreditCard, Clock, ArrowUpRight, ArrowDownRight, Gift, Crown } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

const CREDIT_PACKS = [
  { id: 'pack_500', credits: 500, price: 5, label: 'Starter', popular: false },
  { id: 'pack_2500', credits: 2500, price: 20, label: 'Growth', popular: true, savings: '17%' },
  { id: 'pack_5000', credits: 5000, price: 35, label: 'Pro', popular: false, savings: '30%' },
  { id: 'pack_15000', credits: 15000, price: 90, label: 'Enterprise', popular: false, savings: '40%' },
];

const SUBSCRIPTION_TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['2 course enrollments/month', '100 free credits on signup', 'Basic progress tracking', 'Community access'],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    features: ['Unlimited course access', '5,000 credits/month included', 'AI Tutor unlimited', 'Priority support', 'Certificates included', 'Study plan generator'],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49,
    features: ['Everything in Pro', 'Team management (up to 25)', '20,000 credits/month', 'Custom branding', 'API access', 'Dedicated support', 'Analytics dashboard'],
    cta: 'Contact Sales',
  },
];

interface TransactionRecord {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: { seconds: number };
}

export function CreditsPage() {
  const { user, login } = useAuth();
  const { credits, tier } = useCredits();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingTx(false);
      return;
    }
    const fetchTransactions = async () => {
      try {
        const q = query(
          collection(db, `users/${user.uid}/transactions`),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        const data: TransactionRecord[] = [];
        snap.forEach(doc => data.push({ id: doc.id, ...doc.data() } as TransactionRecord));
        setTransactions(data);
      } catch (err) {
        console.error('Failed to fetch transactions', err);
      } finally {
        setLoadingTx(false);
      }
    };
    fetchTransactions();
  }, [user]);

  const handlePurchase = (packId: string) => {
    if (!user) {
      login();
      return;
    }
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) return;
    // SafePay checkout redirect
    const checkoutUrl = `/api/checkout?pack=${packId}&uid=${user.uid}`;
    window.open(checkoutUrl, '_blank');
    toast.success(`Redirecting to payment for ${pack.credits} credits...`);
  };

  const handleSubscribe = (tierId: string) => {
    if (!user) {
      login();
      return;
    }
    if (tierId === 'enterprise') {
      window.open('mailto:support@guidenza.com?subject=Enterprise%20Plan%20Inquiry', '_blank');
      return;
    }
    const checkoutUrl = `/api/subscribe?tier=${tierId}&uid=${user.uid}`;
    window.open(checkoutUrl, '_blank');
    toast.success('Redirecting to subscription checkout...');
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center">
        <Zap className="w-12 h-12 text-yellow-400 mb-4" />
        <h1 className="text-3xl font-semibold mb-2">Credits & Pricing</h1>
        <p className="text-muted-foreground mb-8">Sign in to purchase credits and unlock premium features.</p>
        <button onClick={login} className="px-8 py-3 rounded-full bg-accent text-accent-foreground font-medium hover:opacity-90 transition">
          Sign In to Continue
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <Helmet><title>Credits & Pricing | Guidenza</title></Helmet>

      {/* Balance Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-sm font-medium mb-4">
          <Zap className="w-4 h-4" />
          {tier === 'free' ? 'Free Plan' : tier === 'pro' ? 'Pro Plan' : 'Enterprise'}
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2">
          {credits.toLocaleString()} <span className="text-muted-foreground text-2xl">credits</span>
        </h1>
        <p className="text-muted-foreground">Use credits to enroll in courses, generate AI content, and more.</p>
      </motion.div>

      {/* Subscription Tiers */}
      <section className="mb-20">
        <h2 className="text-2xl font-semibold mb-8 text-center">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_TIERS.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative liquid-glass rounded-2xl border p-6 flex flex-col ${
                plan.popular ? 'border-accent/50 ring-1 ring-accent/20' : 'border-white/5'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                  Most Popular
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-xl font-medium">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-semibold">${plan.price}</span>
                  {plan.price > 0 && <span className="text-muted-foreground text-sm">/month</span>}
                </div>
              </div>
              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Crown className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={plan.disabled || plan.id === tier}
                className={`w-full py-2.5 rounded-full font-medium text-sm transition ${
                  plan.id === tier
                    ? 'bg-white/5 text-muted-foreground cursor-default'
                    : plan.popular
                    ? 'bg-accent text-accent-foreground hover:opacity-90'
                    : 'bg-white/10 hover:bg-white/15 text-foreground'
                }`}
              >
                {plan.id === tier ? 'Current Plan' : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Credit Packs */}
      <section className="mb-20">
        <h2 className="text-2xl font-semibold mb-2 text-center">Credit Packs</h2>
        <p className="text-muted-foreground text-center mb-8">One-time purchases, no subscription needed.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKS.map((pack) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`liquid-glass rounded-2xl border p-5 flex flex-col relative ${
                pack.popular ? 'border-accent/50 ring-1 ring-accent/20' : 'border-white/5'
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                  Best Value
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="font-medium">{pack.label}</span>
              </div>
              <div className="text-2xl font-semibold mb-1">{pack.credits.toLocaleString()} credits</div>
              {pack.savings && (
                <div className="text-xs text-green-400 mb-2">Save {pack.savings}</div>
              )}
              <div className="text-muted-foreground text-sm mb-4">${pack.price}</div>
              <button
                onClick={() => handlePurchase(pack.id)}
                className="mt-auto w-full py-2 rounded-full bg-white/10 hover:bg-white/15 text-foreground font-medium text-sm transition flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Purchase
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Transaction History */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Transaction History
        </h2>
        {loadingTx ? (
          <div className="text-muted-foreground py-8 text-center">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="liquid-glass rounded-2xl border border-white/5 p-8 text-center text-muted-foreground">
            No transactions yet. Purchase credits or enroll in a course to see your history.
          </div>
        ) : (
          <div className="liquid-glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {tx.amount > 0 ? (
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <ArrowDownRight className="w-4 h-4 text-green-400" />
                      </div>
                    ) : tx.type === 'referral' ? (
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Gift className="w-4 h-4 text-purple-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-red-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} credits
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../contexts/CreditsContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Gift, Copy, Users, CheckCircle2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

const REFERRAL_REWARD = 200;

export function ReferralPage() {
  const { user, login } = useAuth();
  const { credits } = useCredits();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchReferralData = async () => {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setReferralCode(data.referralCode || user.uid.slice(0, 8).toUpperCase());
        setReferralCount(data.referralCount || 0);

        if (!data.referralCode) {
          await updateDoc(userRef, { referralCode: user.uid.slice(0, 8).toUpperCase() });
        }
      }
    };
    fetchReferralData();
  }, [user]);

  const copyCode = () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center">
        <Gift className="w-12 h-12 text-purple-400 mb-4" />
        <h1 className="text-3xl font-semibold mb-2">Referral Program</h1>
        <p className="text-muted-foreground mb-8">Sign in to get your referral link and earn credits.</p>
        <button onClick={login} className="px-8 py-3 rounded-full bg-accent text-accent-foreground font-medium hover:opacity-90 transition">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 max-w-4xl mx-auto">
      <Helmet><title>Referrals | Guidenza</title></Helmet>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-12">
          <Gift className="w-10 h-10 text-purple-400 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">Invite Friends, Earn Credits</h1>
          <p className="text-muted-foreground">Both you and your friend get <span className="text-purple-400 font-medium">{REFERRAL_REWARD} credits</span> when they sign up.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="liquid-glass rounded-xl border border-white/5 p-5 text-center">
            <Users className="w-5 h-5 text-accent mx-auto mb-2" />
            <p className="text-2xl font-semibold">{referralCount}</p>
            <p className="text-xs text-muted-foreground">Friends Referred</p>
          </div>
          <div className="liquid-glass rounded-xl border border-white/5 p-5 text-center">
            <Gift className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-semibold">{referralCount * REFERRAL_REWARD}</p>
            <p className="text-xs text-muted-foreground">Credits Earned</p>
          </div>
          <div className="liquid-glass rounded-xl border border-white/5 p-5 text-center">
            <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-semibold">{credits.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Balance</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="liquid-glass rounded-2xl border border-white/5 p-6 sm:p-8 text-center">
          <h3 className="text-lg font-medium mb-4">Your Referral Link</h3>
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-muted-foreground truncate">
              {window.location.origin}?ref={referralCode}
            </div>
            <button
              onClick={copyCode}
              className="shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground hover:opacity-90 transition"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Share this link — when someone signs up through it, you both earn {REFERRAL_REWARD} credits!</p>
        </div>

        {/* How it works */}
        <div className="mt-10">
          <h3 className="text-lg font-medium mb-4 text-center">How It Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Share your link', desc: 'Send your unique referral link to friends' },
              { step: '2', title: 'They sign up', desc: 'Your friend creates an account using your link' },
              { step: '3', title: 'Both earn credits', desc: `You both receive ${REFERRAL_REWARD} credits instantly` },
            ].map(item => (
              <div key={item.step} className="text-center p-4">
                <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-semibold text-sm flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <p className="text-sm font-medium mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

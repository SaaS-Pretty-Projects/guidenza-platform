import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, increment, addDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';

interface Transaction {
  type: 'purchase' | 'spend' | 'refund' | 'referral' | 'subscription';
  amount: number;
  description: string;
  timestamp: Date;
}

interface CreditsContextValue {
  credits: number;
  loading: boolean;
  tier: 'free' | 'pro' | 'enterprise';
  spend: (amount: number, description: string) => Promise<boolean>;
  canAfford: (amount: number) => boolean;
  addCredits: (amount: number, description: string, type?: Transaction['type']) => Promise<void>;
}

const CreditsContext = createContext<CreditsContextValue | undefined>(undefined);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [tier, setTier] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCredits(0);
      setTier('free');
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCredits(data.credits || 0);
        setTier(data.tier || 'free');
      } else {
        setCredits(0);
        setTier('free');
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const canAfford = useCallback((amount: number) => {
    if (tier === 'pro' || tier === 'enterprise') return true;
    return credits >= amount;
  }, [credits, tier]);

  const spend = useCallback(async (amount: number, description: string): Promise<boolean> => {
    if (!user) return false;
    if (tier === 'pro' || tier === 'enterprise') {
      await addDoc(collection(db, `users/${user.uid}/transactions`), {
        type: 'spend',
        amount: 0,
        description: `[Pro] ${description}`,
        createdAt: serverTimestamp()
      });
      return true;
    }
    if (credits < amount) return false;

    try {
      const userRef = doc(db, 'users', user.uid);
      const batch = writeBatch(db);
      batch.update(userRef, { credits: increment(-amount) });
      const txRef = doc(collection(db, `users/${user.uid}/transactions`));
      batch.set(txRef, {
        type: 'spend',
        amount: -amount,
        description,
        createdAt: serverTimestamp()
      });
      await batch.commit();
      return true;
    } catch {
      return false;
    }
  }, [user, credits, tier]);

  const addCredits = useCallback(async (amount: number, description: string, type: Transaction['type'] = 'purchase') => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { credits: increment(amount) });
    await addDoc(collection(db, `users/${user.uid}/transactions`), {
      type,
      amount,
      description,
      createdAt: serverTimestamp()
    });
  }, [user]);

  return (
    <CreditsContext.Provider value={{ credits, loading, tier, spend, canAfford, addCredits }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits(): CreditsContextValue {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return ctx;
}

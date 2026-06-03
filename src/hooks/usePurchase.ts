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

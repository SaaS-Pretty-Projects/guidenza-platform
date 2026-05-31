import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../contexts/CreditsContext';
import { Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export function CouponInput() {
  const { user } = useAuth();
  const { addCredits } = useCredits();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const redeem = async () => {
    if (!user || !code.trim()) return;
    setLoading(true);
    try {
      const couponRef = doc(db, 'coupons', code.toUpperCase());
      const couponSnap = await getDoc(couponRef);

      if (!couponSnap.exists()) {
        toast.error('Invalid coupon code');
        return;
      }

      const coupon = couponSnap.data();
      if (coupon.usedBy?.includes(user.uid)) {
        toast.error('You have already used this coupon');
        return;
      }
      if (coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) {
        toast.error('This coupon has reached its usage limit');
        return;
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        toast.error('This coupon has expired');
        return;
      }

      await addCredits(coupon.credits, `Coupon: ${code.toUpperCase()}`);
      await updateDoc(couponRef, {
        usedBy: [...(coupon.usedBy || []), user.uid],
        usedCount: increment(1)
      });

      toast.success(`Redeemed! +${coupon.credits} credits`);
      setCode('');
    } catch (err) {
      console.error('Coupon redeem error:', err);
      toast.error('Failed to redeem coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>
      <button
        onClick={redeem}
        disabled={loading || !code.trim()}
        className="px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? '...' : 'Redeem'}
      </button>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function CouponInput() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const redeem = async () => {
    if (!user || !code.trim()) return;
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        toast.error('Please sign in again');
        return;
      }
      const res = await fetch(`${API_BASE}/api/redeem-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to redeem coupon');
        return;
      }

      toast.success(`Redeemed! +${data.credits} credits`);
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

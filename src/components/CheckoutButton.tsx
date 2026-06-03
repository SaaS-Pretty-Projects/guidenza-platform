import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { usePurchase } from '../hooks/usePurchase';

interface CheckoutButtonProps {
  courseId: string;
  amount: number;
  currency?: string;
}

export function CheckoutButton({ courseId, amount, currency = 'PKR' }: CheckoutButtonProps) {
  const { user } = useAuth();
  const { purchased, loading, checking, buy } = usePurchase(courseId, amount);
  const [processing, setProcessing] = useState(false);

  if (checking) return null;

  if (purchased) return null;

  const handleClick = async () => {
    if (!user) {
      toast.error('Please sign in to purchase');
      return;
    }
    setProcessing(true);
    try {
      await buy();
    } catch {
      toast.error('Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={processing || loading}
      className="w-full sm:w-auto px-8 py-3 bg-foreground text-background font-semibold rounded-full hover:scale-[1.02] transition-transform disabled:opacity-50"
    >
      {processing ? 'Redirecting to payment...' : `Buy for ${currency === 'PKR' ? 'Rs.' : '$'}${amount}`}
    </button>
  );
}

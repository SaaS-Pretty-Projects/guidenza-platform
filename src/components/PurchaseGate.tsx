import { type ReactNode } from 'react';
import { CheckoutButton } from './CheckoutButton';

interface PurchaseGateProps {
  courseId: string;
  amount: number;
  currency?: string;
  preview: ReactNode;
  full: ReactNode;
  purchased: boolean;
  checking: boolean;
}

export function PurchaseGate({ courseId, amount, currency, preview, full, purchased, checking }: PurchaseGateProps) {
  if (checking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (purchased) return <>{full}</>;

  return (
    <div>
      {preview}
      <div className="mt-6 p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
        <p className="text-muted-foreground mb-4">
          Unlock full access to all modules and features
        </p>
        <CheckoutButton courseId={courseId} amount={amount} currency={currency} />
      </div>
    </div>
  );
}

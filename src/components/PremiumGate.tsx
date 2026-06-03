import React from 'react';
import { useCredits } from '../contexts/CreditsContext';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface PremiumGateProps {
  cost: number;
  featureName: string;
  children: React.ReactNode;
  onPurchase?: () => Promise<void>;
}

export function PremiumGate({ cost, featureName, children, onPurchase }: PremiumGateProps) {
  const { user, login } = useAuth();
  const { canAfford, tier } = useCredits();

  if (!user) {
    return (
      <div className="relative rounded-2xl border border-white/10 overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-md bg-background/80 z-10 flex flex-col items-center justify-center gap-4 p-8">
          <Lock className="w-8 h-8 text-muted-foreground" />
          <p className="text-center text-muted-foreground">Sign in to access {featureName}</p>
          <button
            onClick={login}
            className="px-6 py-2.5 rounded-full bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition"
          >
            Sign In
          </button>
        </div>
        <div className="opacity-20 pointer-events-none">{children}</div>
      </div>
    );
  }

  if (tier === 'pro' || tier === 'enterprise' || canAfford(cost)) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-2xl border border-white/10 overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-md bg-background/80 z-10 flex flex-col items-center justify-center gap-4 p-8">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-8 h-8 text-yellow-400" />
        </motion.div>
        <p className="text-center font-medium">This feature requires {cost} credits</p>
        <p className="text-sm text-muted-foreground text-center">
          You need {cost - (canAfford(cost) ? cost : 0)} more credits to access {featureName}
        </p>
        {onPurchase ? (
          <button
            onClick={onPurchase}
            className="px-6 py-2.5 rounded-full bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition"
          >
            Buy Credits
          </button>
        ) : (
          <a
            href="/credits"
            className="px-6 py-2.5 rounded-full bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition"
          >
            Buy Credits
          </a>
        )}
      </div>
      <div className="opacity-20 pointer-events-none">{children}</div>
    </div>
  );
}

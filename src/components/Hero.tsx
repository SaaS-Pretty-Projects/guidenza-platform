import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/animations';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AVATARS = [
  "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
  "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
  "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"
];

export function Hero() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
      await addDoc(collection(db, 'subscriptions'), {
        email,
        createdAt: serverTimestamp()
      });
      setStatus('success');
      setEmail('');
    } catch (error) {
      console.error(error);
      setStatus('error');
      // Use the required error handler
      handleFirestoreError(error, OperationType.CREATE, 'subscriptions');
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/hero.mp4"
      />
      
      {/* Soft overlay */}
      <div className="absolute inset-0 bg-background/20 z-[0]" />

      {/* Bottom fade */}
      <div className="absolute bottom-0 w-full h-64 bg-gradient-to-t from-background to-transparent z-[1]" />

      {/* Content */}
      <div className="relative z-10 pt-28 md:pt-32 px-6 flex flex-col items-center text-center w-full">
        {/* Social Proof */}
        <motion.div
          {...fadeUp(0)}
          className="flex items-center gap-3 mb-8"
        >
          <div className="flex -space-x-3">
            {AVATARS.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="Avatar"
                className="w-8 h-8 rounded-full border-2 border-background object-cover relative z-[3-i]"
                style={{ zIndex: 3 - i }}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            10,000+ learners and creators joined
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          {...fadeUp(0.1)}
          className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-[-2px] max-w-5xl leading-[1.02] text-foreground"
        >
          Get <span className="font-serif italic font-normal text-foreground">Expert</span> Knowledge
        </motion.h1>

        {/* Subhead */}
        <motion.p
          {...fadeUp(0.25)}
          className="text-lg max-w-2xl mt-8 mx-auto text-[color:var(--color-hero-subtitle)]"
        >
          Guidenza – expert-led courses and trusted knowledge from real specialists. Discover varied approaches and topics in one seamless ecosystem.
        </motion.p>

        {/* Form */}
        <motion.form
          {...fadeUp(0.4)}
          onSubmit={handleSubmit}
          className="liquid-glass rounded-full p-2 max-w-lg w-full mt-10 md:mt-12 flex items-center gap-2 mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
            placeholder={status === 'success' ? "Thanks for subscribing!" : "Enter your email to join"}
            className="flex-1 bg-transparent border-none text-foreground px-4 py-2 outline-none placeholder:text-muted-foreground disabled:opacity-50"
            required
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="bg-foreground text-background shrink-0 rounded-full px-8 py-3 text-xs font-semibold tracking-[2px] uppercase disabled:opacity-50 transition-opacity"
          >
            {status === 'loading' ? 'JOINING...' : status === 'success' ? 'JOINED!' : 'GET STARTED'}
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/animations';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useMagnetic } from '../hooks/useMagnetic';
import { useReducedMotion } from '../hooks/useReducedMotion';

const AVATARS = [
  "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
  "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
  "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"
];

const headlineContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0.1 }
  }
};

const charVariant = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  visible: { 
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

function SplitText({ children, className }: { children: string; className?: string }) {
  return (
    <>
      {children.split('').map((char, i) => (
        <motion.span
          key={i}
          variants={charVariant}
          className={`inline-block ${char === ' ' ? 'w-[0.25em]' : ''} ${className || ''}`}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </>
  );
}

export function Hero() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const magnetic = useMagnetic(0.2);
  const reducedMotion = useReducedMotion();

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

      {/* Parallax depth orbs */}
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -20, 0], x: [0, 10, 0] }}
        transition={reducedMotion ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[15%] w-64 h-64 rounded-full bg-accent/5 blur-[80px] z-[1]"
      />
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, 15, 0], x: [0, -15, 0] }}
        transition={reducedMotion ? undefined : { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[30%] right-[10%] w-80 h-80 rounded-full bg-purple-500/5 blur-[100px] z-[1]"
      />
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -10, 0], x: [0, 8, 0] }}
        transition={reducedMotion ? undefined : { duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute top-[50%] right-[30%] w-48 h-48 rounded-full bg-blue-500/5 blur-[60px] z-[1]"
      />

      {/* Bottom fade */}
      <div className="absolute bottom-0 w-full h-64 bg-gradient-to-t from-background to-transparent z-[1]" />

      {/* Content */}
      <div className="relative z-10 pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6 flex flex-col items-center text-center w-full">
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
                className="w-8 h-8 rounded-full border-2 border-background object-cover relative"
                style={{ zIndex: 3 - i }}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            10,000+ learners and creators joined
          </span>
        </motion.div>

        {/* H1 - Character stagger */}
        <motion.h1
          variants={headlineContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-medium tracking-[-1.5px] md:tracking-[-2px] max-w-5xl leading-[1.05] md:leading-[1.02] text-foreground"
        >
          <SplitText>Get </SplitText>
          <SplitText className="font-serif italic font-normal">Expert</SplitText>
          <SplitText> Knowledge</SplitText>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          {...fadeUp(0.4)}
          className="text-base sm:text-lg max-w-2xl mt-6 sm:mt-8 mx-auto text-[color:var(--color-hero-subtitle)]"
        >
          Guidenza – expert-led courses and trusted knowledge from real specialists. Discover varied approaches and topics in one seamless ecosystem.
        </motion.p>

        {/* Form */}
        <motion.form
          {...fadeUp(0.6)}
          onSubmit={handleSubmit}
          className="liquid-glass rounded-full p-1.5 sm:p-2 max-w-lg w-full mt-8 sm:mt-10 md:mt-12 flex items-center gap-1.5 sm:gap-2 mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
            placeholder={status === 'success' ? "Thanks for subscribing!" : "Enter your email to join"}
            className="flex-1 min-w-0 bg-transparent border-none text-foreground px-3 sm:px-4 py-2 outline-none placeholder:text-muted-foreground disabled:opacity-50 text-sm sm:text-base"
            required
          />
          <motion.button
            ref={magnetic.ref as React.Ref<HTMLButtonElement>}
            onMouseMove={magnetic.onMouseMove}
            onMouseLeave={magnetic.onMouseLeave}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            style={{ '--magnetic-x': '0px', '--magnetic-y': '0px' } as React.CSSProperties}
            className="bg-foreground text-background shrink-0 rounded-full px-5 sm:px-8 py-2.5 sm:py-3 text-[10px] sm:text-xs font-semibold tracking-[1.5px] sm:tracking-[2px] uppercase disabled:opacity-50 transition-opacity magnetic-target"
          >
            {status === 'loading' ? 'JOINING...' : status === 'success' ? 'JOINED!' : 'GET STARTED'}
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
}

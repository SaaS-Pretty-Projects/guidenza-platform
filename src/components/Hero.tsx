import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/animations';

const AVATARS = [
  "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
  "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
  "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"
];

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_155101_f2540600-6fe9-433e-8e48-b3f4b72f0727.mp4"
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
            7,000+ people already subscribed
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          {...fadeUp(0.1)}
          className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-[-2px] max-w-5xl leading-[1.02] text-foreground"
        >
          Get <span className="font-serif italic font-normal text-foreground">Inspired</span> with Us
        </motion.h1>

        {/* Subhead */}
        <motion.p
          {...fadeUp(0.25)}
          className="text-lg max-w-2xl mt-8 mx-auto text-[color:var(--color-hero-subtitle)]"
        >
          Join our feed for meaningful updates, news around technology and a shared journey toward depth and direction.
        </motion.p>

        {/* Form */}
        <motion.form
          {...fadeUp(0.4)}
          onSubmit={(e) => e.preventDefault()}
          className="liquid-glass rounded-full p-2 max-w-lg w-full mt-10 md:mt-12 flex items-center gap-2 mx-auto"
        >
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 bg-transparent border-none text-foreground px-4 py-2 outline-none placeholder:text-muted-foreground"
            required
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="bg-foreground text-background shrink-0 rounded-full px-8 py-3 text-xs font-semibold tracking-[2px] uppercase"
          >
            SUBSCRIBE
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
}

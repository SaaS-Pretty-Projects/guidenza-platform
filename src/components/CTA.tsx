import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, cinematicSection } from '../lib/animations';
import { Logo } from './Logo';

export function CTA() {
  return (
    <motion.section {...cinematicSection} className="relative py-32 md:py-44 border-t border-border/30 overflow-hidden px-6 md:px-8 flex justify-center">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-[0]"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/45 z-[1]" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl flex flex-col items-center text-center">
        <motion.div {...fadeUp(0)}>
          <Logo className="h-12 w-auto" />
        </motion.div>

        <motion.h2 
          {...fadeUp(0.1)}
          className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-[-1px] mt-8 leading-[1.05]"
        >
          <span className="font-serif italic font-normal">Share</span> Your Expertise
        </motion.h2>

        <motion.p
          {...fadeUp(0.2)}
          className="text-lg md:text-xl text-muted-foreground mt-6 max-w-xl mx-auto"
        >
          Join our marketplace today. As a learner, expand your skills. As an expert, monetize your knowledge.
        </motion.p>

        <motion.div
          {...fadeUp(0.3)}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-foreground text-background rounded-lg px-8 py-3.5 text-sm font-semibold w-full sm:w-auto"
          >
            Explore Courses
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="liquid-glass border border-white/10 rounded-lg px-8 py-3.5 text-sm font-semibold w-full sm:w-auto"
          >
            Become an Instructor
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
}

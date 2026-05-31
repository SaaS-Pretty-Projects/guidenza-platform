import React from 'react';
import { motion } from 'framer-motion';

export function SectionDivider() {
  return (
    <div className="relative w-full flex justify-center overflow-hidden py-1">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-border to-transparent origin-center"
      />
    </div>
  );
}

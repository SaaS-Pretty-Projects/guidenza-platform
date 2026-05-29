import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

const PARAGRAPH_1 = "We're building a space where expertise meets demand — where learners find depth, creators find reach, and every course becomes a transformative experience.".split(' ');
const PARAGRAPH_2 = "A digital educational service connecting top-tier authors with eager minds, removing technical and organizational barriers for everyone involved.".split(' ');

const HIGHLIGHTS = ["expertise", "meets", "demand"];

function Word({ 
  children, 
  progress, 
  range, 
  isHighlight 
}: { 
  children: React.ReactNode; 
  progress: MotionValue<number>; 
  range: [number, number]; 
  isHighlight: boolean; 
}) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  const blurRaw = useTransform(progress, range, [6, 0]);
  const filter = useTransform(blurRaw, (v) => `blur(${v}px)`);

  return (
    <motion.span
      style={{ 
        opacity, 
        filter,
        textShadow: isHighlight ? '0 2px 24px rgba(0,0,0,0.8)' : '0 2px 20px rgba(0,0,0,0.6)'
      }}
      className={`inline-block mr-[0.25em] ${isHighlight ? 'text-white' : 'text-[color:var(--color-hero-subtitle)]'}`}
    >
      {children}
    </motion.span>
  );
}

export function Mission() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.2"]
  });

  // Parallax background
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  // scale bounces 1.08 -> 1.02 -> 1.08
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1.02, 1.08]);

  const totalWords = PARAGRAPH_1.length + PARAGRAPH_2.length;

  return (
    <section ref={containerRef} className="relative w-full">
      <div className="h-[130vh] md:h-[150vh] overflow-hidden relative">
        {/* Background parralax video */}
        <motion.div 
          style={{ y, scale }}
          className="absolute inset-0 w-full h-[120%] -top-[10%]"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4"
          />
        </motion.div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-background/25 z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-[1] pointer-events-none" />
        <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-background to-transparent z-[2]" />
        <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-background to-transparent z-[2]" />

        {/* Sticky Content */}
        <div className="sticky top-0 h-screen flex flex-col items-center justify-end pb-16 md:pb-24 px-6 md:px-8 z-[3] max-w-5xl mx-auto text-center">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px w-8 bg-border" />
            <span className="text-xs uppercase tracking-[3px] text-muted-foreground">
              Our Mission
            </span>
            <div className="h-px w-8 bg-border" />
          </div>

          <div className="flex flex-col gap-8 md:gap-12">
            <p className="text-2xl md:text-4xl lg:text-6xl font-medium tracking-[-1.5px] leading-[1.12]">
              {PARAGRAPH_1.map((word, i) => {
                const start = i / totalWords;
                const end = start + (1 / totalWords);
                const isHighlight = HIGHLIGHTS.includes(word.replace(/[^a-zA-Z]/g, ''));
                return (
                  <Word key={`p1-${i}`} progress={scrollYProgress} range={[start, end]} isHighlight={isHighlight}>
                    {word}
                  </Word>
                );
              })}
            </p>

            <p className="text-xl md:text-2xl lg:text-3xl max-w-3xl mx-auto">
              {PARAGRAPH_2.map((word, i) => {
                const index = i + PARAGRAPH_1.length;
                const start = index / totalWords;
                const end = start + (1 / totalWords);
                return (
                  <Word key={`p2-${i}`} progress={scrollYProgress} range={[start, end]} isHighlight={false}>
                    {word}
                  </Word>
                );
              })}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-16 text-xs uppercase tracking-[3px] text-muted-foreground">
            <span>Courses</span>
            <span className="w-1 h-1 rounded-full bg-border/60" />
            <span>Experts</span>
            <span className="w-1 h-1 rounded-full bg-border/60" />
            <span>Ecosystem</span>
          </div>
        </div>
      </div>
    </section>
  );
}

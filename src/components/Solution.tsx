import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/animations';
import { Compass, PenLine, Users, Radio } from 'lucide-react';

const FEATURES = [
  {
    icon: Compass,
    title: "Curated Feed",
    desc: "Editorial-quality recommendations that match your pace and depth."
  },
  {
    icon: PenLine,
    title: "Writer Tools",
    desc: "A calm canvas with the scaffolding serious writers ask for."
  },
  {
    icon: Users,
    title: "Community",
    desc: "Thoughtful readers and creators rewarded for their attention."
  },
  {
    icon: Radio,
    title: "Distribution",
    desc: "Reach built on signal, not noise — measured by meaning."
  }
];

export function Solution() {
  return (
    <section className="py-32 md:py-44 border-t border-border/30 px-6 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12">
        {/* Left Column - Sticky */}
        <div className="lg:col-span-5">
          <motion.div {...fadeUp(0)} className="lg:sticky lg:top-32">
            <div className="text-xs uppercase tracking-[3px] text-muted-foreground mb-6">
              Solution
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-[-1px] mb-6">
              The platform for <span className="font-serif italic font-normal">meaningful</span> content
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Four tools, one quiet ecosystem — built so writing, reading, and discovering all reward the same thing: depth.
            </p>
            <div className="rounded-2xl overflow-hidden aspect-video border border-border/20 bg-muted">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_153148_d7a3e1dd-e5d0-4ce6-8306-00d7522ecc44.mp4"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Column - Features List */}
        <div className="lg:col-span-7 flex flex-col">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              {...fadeUp(i * 0.1)}
              className={`py-10 md:py-14 flex items-start gap-6 ${
                i !== FEATURES.length - 1 ? 'border-b border-border/40' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center shrink-0">
                <feature.icon size={24} strokeWidth={1.5} className="text-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-xl md:text-2xl font-semibold tracking-[-0.5px]">
                    {feature.title}
                  </h3>
                  <span className="text-muted-foreground tracking-[2px] font-mono text-sm">
                    0{i + 1}
                  </span>
                </div>
                <p className="text-muted-foreground text-lg">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

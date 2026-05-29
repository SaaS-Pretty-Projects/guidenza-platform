import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/animations';
import { ArrowUpRight, GraduationCap, LayoutTemplate, ShieldCheck } from 'lucide-react';

const CARDS = [
  {
    icon: GraduationCap,
    stat: "1,000+",
    label: "active experts",
    name: "Broader Choice",
    desc: "Access a wider selection of authors, approaches, and topics in one place."
  },
  {
    icon: LayoutTemplate,
    stat: "Zero",
    label: "setup required",
    name: "For Creators",
    desc: "A ready-made system to host and monetize your knowledge easily."
  },
  {
    icon: ShieldCheck,
    stat: "100%",
    label: "seamless",
    name: "The Platform",
    desc: "We handle the storefront, payments, and promotion so you focus on content."
  }
];

export function SearchChanged() {
  return (
    <section className="pt-52 md:pt-64 pb-20 px-6 md:px-8 max-w-7xl mx-auto">
      {/* Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
        <motion.div {...fadeUp(0)} className="lg:col-span-7">
          <div className="text-xs uppercase tracking-[3px] text-muted-foreground mb-6">
            The Marketplace
          </div>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-[-2px] leading-[0.95]">
            Education has <span className="font-serif italic font-normal">evolved.</span><br />
            Have you?
          </h2>
        </motion.div>
        
        <motion.div {...fadeUp(0.2)} className="lg:col-span-5 flex items-end">
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md">
            The way people consume learning has shifted. They don't want a single brand; they want a diverse marketplace of top-tier experts, seamless infrastructure, and trusted content.
          </p>
        </motion.div>
      </div>

      {/* Cards Grid */}
      <motion.div 
        {...fadeUp(0.4)}
        className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-border/40 rounded-3xl overflow-hidden border border-border/40 mt-16 md:mt-24"
      >
        {CARDS.map((card, i) => (
          <div 
            key={i} 
            className="bg-background group p-8 md:p-10 hover:bg-white/[0.02] transition-colors flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-16">
              <div className="w-12 h-12 rounded-2xl liquid-glass flex items-center justify-center text-foreground">
                <card.icon size={20} strokeWidth={1.5} />
              </div>
              <div className="text-muted-foreground group-hover:text-foreground transition-all duration-300 transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                <ArrowUpRight strokeWidth={1.5} />
              </div>
            </div>
            
            <div className="mt-auto">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl md:text-5xl font-medium tracking-[-1px]">{card.stat}</span>
                <span className="text-sm text-muted-foreground">{card.label}</span>
              </div>
              <div className="font-semibold text-foreground mb-1">
                {card.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {card.desc}
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Centered Quote */}
      <motion.div 
        {...fadeUp(0.6)}
        className="flex flex-col items-center justify-center mt-24 md:mt-32 gap-6 text-center"
      >
        <div className="h-px w-12 bg-border" />
        <p className="text-lg md:text-xl font-medium text-muted-foreground max-w-lg">
          If you don't answer the questions, <span className="text-foreground">someone else will.</span>
        </p>
        <div className="h-px w-12 bg-border" />
      </motion.div>
    </section>
  );
}

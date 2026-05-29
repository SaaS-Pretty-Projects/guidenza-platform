import React from 'react';
import { Instagram, Linkedin, Twitter } from 'lucide-react';
import { Logo } from './Logo';
import { motion } from 'framer-motion';

const FOOTER_LINKS = [
  {
    title: "Product",
    links: ["Explore", "Categories", "Pricing", "Changelog"]
  },
  {
    title: "Resources",
    links: ["Creator Guide", "Learner FAQ", "Terms", "Brand"]
  },
  {
    title: "Company",
    links: ["About", "Careers", "Contact", "Blog"]
  }
];

export function Footer() {
  return (
    <footer className="relative border-t border-border/30 overflow-hidden bg-background">
      <div className="px-6 md:px-8 max-w-7xl mx-auto pt-20 pb-12 relative z-10">
        {/* Top Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-border/30">
          {/* Left Column */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <Logo />
            <p className="text-muted-foreground text-lg max-w-sm">
              Guidenza – trusted knowledge from real specialists. A single platform for expert learning.
            </p>
            <div className="flex items-center gap-2">
              {[Instagram, Linkedin, Twitter].map((Icon, i) => (
                <motion.button 
                  key={i}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-foreground transition-colors"
                >
                  <Icon size={18} strokeWidth={1.5} />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right Column - Links */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            {FOOTER_LINKS.map((col, i) => (
              <div key={i} className="flex flex-col gap-6">
                <h4 className="text-xs uppercase tracking-[3px] text-muted-foreground">
                  {col.title}
                </h4>
                <div className="flex flex-col gap-4">
                  {col.links.map((link, j) => (
                    <a 
                      key={j} 
                      href="#"
                      className="text-foreground hover:text-muted-foreground transition-colors font-medium text-sm"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Guidenza. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
          </div>
        </div>
      </div>

      {/* Giant watermark */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none select-none text-center overflow-hidden flex justify-center -mb-[4vw]"
        aria-hidden="true"
      >
        <span className="text-[18vw] leading-none font-serif italic text-foreground/[0.04] tracking-[-0.02em]">
          guidenza
        </span>
      </div>
    </footer>
  );
}

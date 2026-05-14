import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Instagram, Linkedin, Twitter, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = ['Home', 'How It Works', 'Philosophy', 'Use Cases'];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 flex justify-center">
      <div
        className={`w-full max-w-6xl rounded-full flex items-center justify-between transition-all duration-500 ${
          scrolled ? 'liquid-glass px-5 py-2.5' : 'bg-transparent px-6 py-3'
        }`}
      >
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* Center: Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="group relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link}
              <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Right: Desktop Socials & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1">
            {[Instagram, Linkedin, Twitter].map((Icon, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-foreground transition-colors"
              >
                <Icon size={16} strokeWidth={1.5} />
              </motion.button>
            ))}
          </div>
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-4 right-4 liquid-glass rounded-2xl p-4 flex flex-col gap-4 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link}
              </a>
            ))}
            <div className="flex items-center gap-4 pt-4 border-t border-border/30">
              {[Instagram, Linkedin, Twitter].map((Icon, i) => (
                <motion.button 
                  key={i}
                  whileHover={{ scale: 1.1, color: "var(--color-primary)" }}
                  whileTap={{ scale: 0.95 }} 
                  className="text-foreground transition-colors"
                >
                  <Icon size={20} strokeWidth={1.5} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

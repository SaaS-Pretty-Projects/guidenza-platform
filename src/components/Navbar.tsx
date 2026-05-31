import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Instagram, Linkedin, Twitter, Menu, UserCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from './SearchBar';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const NAV_LINKS = ['Explore', 'For Creators', 'Philosophy', 'Categories'];

const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
      staggerChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.15,
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 }
};

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, login, logout, loading } = useAuth();

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
          <Link to="/">
            <Logo />
          </Link>
        </div>

        {/* Center: Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/explore" className="group relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Explore
            <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
          </Link>
          <a href="#" className="group relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            For Creators
            <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#" className="group relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Philosophy
            <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
          </a>
          {user && (
            <Link to="/dashboard" className="group relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
              <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-foreground transition-all duration-300 group-hover:w-full" />
            </Link>
          )}
        </div>

        {/* Right: Desktop Socials, Auth & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1">
            <SearchBar />
            {!loading && (
              user ? (
                <div className="group relative">
                  <button className="w-9 h-9 rounded-full px-0 flex items-center justify-center text-foreground hover:bg-white/5 transition-colors overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserCircle size={18} strokeWidth={1.5} />
                    )}
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 py-2 liquid-glass rounded-xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
                    <div className="px-4 py-2 border-b border-white/10 mb-2 truncate">
                      <p className="text-sm font-medium text-foreground">{user.displayName || 'Profile'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Link 
                      to="/dashboard"
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/5"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/instructor-dashboard"
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/5"
                    >
                      Instructor Dashboard
                    </Link>
                    <button 
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/5 flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={login}
                  className="bg-foreground text-background shrink-0 rounded-full px-5 py-2 text-xs font-semibold tracking-wide"
                >
                  Sign In
                </button>
              )
            )}
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
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-20 left-4 right-4 liquid-glass rounded-2xl p-4 flex flex-col gap-4 md:hidden overflow-hidden"
          >
            <motion.div variants={itemVariants}>
              <Link to="/explore" className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors block" onClick={() => setMobileMenuOpen(false)}>
                Explore
              </Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <a href="#" className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors block" onClick={() => setMobileMenuOpen(false)}>
                For Creators
              </a>
            </motion.div>
            <motion.div variants={itemVariants}>
              <a href="#" className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors block" onClick={() => setMobileMenuOpen(false)}>
                Philosophy
              </a>
            </motion.div>
            {user && (
              <motion.div variants={itemVariants}>
                <Link to="/dashboard" className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors block" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              </motion.div>
            )}
            {user && (
              <motion.div variants={itemVariants}>
                <Link to="/instructor-dashboard" className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors block" onClick={() => setMobileMenuOpen(false)}>
                  Instructor Dashboard
                </Link>
              </motion.div>
            )}
            {!user ? (
              <motion.div variants={itemVariants}>
                <button 
                  onClick={() => { login(); setMobileMenuOpen(false); }}
                  className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors block text-left"
                >
                  Sign In
                </button>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants}>
                <button 
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors block text-left"
                >
                  Sign Out
                </button>
              </motion.div>
            )}
            <motion.div variants={itemVariants} className="flex items-center gap-4 pt-4 border-t border-border/30">
              {[Instagram, Linkedin, Twitter].map((Icon, i) => (
                <motion.button 
                  key={i}
                  whileHover={{ scale: 1.1, color: "var(--color-primary)" }}
                  whileTap={{ scale: 0.95 }} 
                  className="text-foreground transition-colors p-1"
                >
                  <Icon size={20} strokeWidth={1.5} />
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

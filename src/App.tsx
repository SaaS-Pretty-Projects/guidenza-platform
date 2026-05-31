import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SearchChanged } from './components/SearchChanged';
import { Mission } from './components/Mission';
import { Solution } from './components/Solution';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { cinematicSection } from './lib/animations';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Explore } from './components/Explore';
import { InstructorProfile } from './components/InstructorProfile';
import { InstructorDashboard } from './components/InstructorDashboard';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { ScrollProgress } from './components/ScrollProgress';
import { FilmGrain } from './components/FilmGrain';
import { ScrollToTop } from './components/ScrollToTop';
import { SectionDivider } from './components/SectionDivider';
import { useLenis } from './hooks/useLenis';

function SectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...cinematicSection}>
      {children}
    </motion.div>
  );
}

function Landing() {
  return (
    <main>
      <Hero />
      <SectionDivider />
      <SectionWrapper>
        <SearchChanged />
      </SectionWrapper>
      <SectionDivider />
      <SectionWrapper>
        <Mission />
      </SectionWrapper>
      <SectionDivider />
      <SectionWrapper>
        <Solution />
      </SectionWrapper>
      <SectionDivider />
      <CTA />
    </main>
  );
}

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...pageTransition}>
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/instructor/:authorName" element={<InstructorProfile />} />
          <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  useLenis();

  return (
    <div className="bg-background text-foreground min-h-screen font-sans overflow-x-hidden">
      <FilmGrain />
      <ScrollProgress />
      <Toaster 
        position="bottom-center" 
        toastOptions={{
          style: {
            background: 'rgb(24, 24, 27)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      />
      <Navbar />
      <ScrollToTop />
      <AnimatedRoutes />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

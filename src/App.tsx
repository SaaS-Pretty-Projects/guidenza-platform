import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SearchChanged } from './components/SearchChanged';
import { Mission } from './components/Mission';
import { Solution } from './components/Solution';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { motion } from 'framer-motion';
import { cinematicSection } from './lib/animations';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Explore } from './components/Explore';
import { InstructorProfile } from './components/InstructorProfile';
import { InstructorDashboard } from './components/InstructorDashboard';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';

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
      <SectionWrapper>
        <SearchChanged />
      </SectionWrapper>
      <SectionWrapper>
        <Mission />
      </SectionWrapper>
      <SectionWrapper>
        <Solution />
      </SectionWrapper>
      <CTA />
    </main>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
      <BrowserRouter>
        <div className="bg-background text-foreground min-h-screen font-sans overflow-x-hidden">
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
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/instructor/:authorName" element={<InstructorProfile />} />
            <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
      </AuthProvider>
    </HelmetProvider>
  );
}

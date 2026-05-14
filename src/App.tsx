import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SearchChanged } from './components/SearchChanged';
import { Mission } from './components/Mission';
import { Solution } from './components/Solution';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="bg-background text-foreground min-h-screen font-sans overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <SearchChanged />
        <Mission />
        <Solution />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

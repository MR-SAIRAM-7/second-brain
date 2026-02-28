import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import NeuralBackground from '@/components/three/NeuralBackground';
import Navigation from '@/components/Navigation';
import Hero from '@/sections/landing/Hero';
import LogoStream from '@/sections/landing/LogoStream';
import HowItWorks from '@/sections/landing/HowItWorks';
import Features from '@/sections/landing/Features';
import Testimonials from '@/sections/landing/Testimonials';

import FAQ from '@/sections/landing/FAQ';
import CTA from '@/sections/landing/CTA';
import Footer from '@/sections/landing/Footer';
import Dashboard from '@/sections/dashboard/Dashboard';
import Docs from '@/sections/docs/Docs';

gsap.registerPlugin(ScrollTrigger);

type View = 'landing' | 'dashboard' | 'docs';

function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Refresh ScrollTrigger when view changes
    if (!isLoading) {
      ScrollTrigger.refresh();
    }
  }, [currentView, isLoading]);

  // Smooth Scrolling
  useEffect(() => {
    const lenis = new Lenis();

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
    };
  }, []);

  const handleGetStarted = () => {
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDocs = () => {
    setCurrentView('docs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl bg-indigo-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <p className="text-gray-400">Loading Second Brain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Neural Background - only on landing */}
      {currentView === 'landing' && <NeuralBackground />}

      {/* Navigation - only on landing */}
      {currentView === 'landing' && <Navigation onGetStarted={handleGetStarted} />}

      {/* Main Content */}
      <main>
        {currentView === 'landing' && (
          <>
            <Hero onGetStarted={handleGetStarted} />
            <div id="logos">
              <LogoStream />
            </div>
            <div id="how-it-works">
              <HowItWorks />
            </div>
            <div id="features">
              <Features />
            </div>
            <Testimonials />

            <div id="faq">
              <FAQ />
            </div>
            <CTA onGetStarted={handleGetStarted} />
            <Footer />
          </>
        )}

        {currentView === 'dashboard' && (
          <Dashboard onBack={handleBackToLanding} onViewDocs={handleViewDocs} />
        )}

        {currentView === 'docs' && (
          <Docs onBack={handleBackToLanding} />
        )}
      </main>

      {/* Progress bar - only on landing */}
      {currentView === 'landing' && <ProgressBar />}
    </div>
  );
}

// Progress bar component
function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed left-0 top-0 bottom-0 w-1 z-50 bg-white/5">
      <div
        className="w-full bg-gradient-to-b from-indigo-500 to-purple-500 transition-all duration-100"
        style={{ height: `${progress}%` }}
      />
    </div>
  );
}

export default App;

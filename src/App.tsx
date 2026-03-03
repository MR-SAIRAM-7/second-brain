import { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
import { Auth } from '@/sections/auth/Auth';
import db from '@/lib/db';
import type { User } from '@/types';

gsap.registerPlugin(ScrollTrigger);

type View = 'landing' | 'dashboard' | 'docs' | 'auth';
const AUTH_TOKEN_KEY = 'sb_jwt';

function App() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (!token) return;

    db.user.getCurrent()
      .then((current) => {
        setUser(current);
        setCurrentView('dashboard');
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Give DOM time to render before refreshing
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    }
  }, [currentView, isLoading]);

  // Native scrolling only (no smooth scroll per requirements)
  useEffect(() => {
    const onScroll = () => ScrollTrigger.update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // View transition with exit animation
  const transitionTo = useCallback((view: View) => {
    if (isTransitioning || !mainRef.current) {
      setCurrentView(view);
      window.scrollTo({ top: 0 });
      return;
    }

    setIsTransitioning(true);

    // Animate out
    gsap.to(mainRef.current, {
      opacity: 0,
      y: -30,
      duration: 0.4,
      ease: 'linear',
      onComplete: () => {
        setCurrentView(view);
        window.scrollTo({ top: 0 });

        // Animate in
        requestAnimationFrame(() => {
          if (mainRef.current) {
            gsap.fromTo(mainRef.current,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: 'linear',
                onComplete: () => setIsTransitioning(false),
              }
            );
          } else {
            setIsTransitioning(false);
          }
        });
      },
    });
  }, [isTransitioning]);

  const handleGetStarted = () => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem(AUTH_TOKEN_KEY);
    transitionTo(hasToken ? 'dashboard' : 'auth');
  };
  const handleViewDocs = () => transitionTo('docs');
  const handleBackToLanding = () => transitionTo('landing');
  const handleAuthSuccess = ({ token, user }: { token: string; user: User }) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setUser(user);
    transitionTo('dashboard');
  };
  const handleSignOut = () => {
    db.auth.logout();
    setUser(null);
    transitionTo('auth');
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium tracking-wider">LOADING</p>
          <div className="mt-4 w-32 h-0.5 bg-white/10 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      {currentView === 'landing' && <NeuralBackground />}
      {currentView === 'landing' && <Navigation onGetStarted={handleGetStarted} />}

      <div ref={mainRef}>
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

          {currentView === 'auth' && (
            <Auth onBack={handleBackToLanding} onSuccess={handleAuthSuccess} />
          )}

          {currentView === 'dashboard' && (
            <Dashboard
              onBack={handleBackToLanding}
              onViewDocs={handleViewDocs}
              onSignOut={handleSignOut}
              user={user}
            />
          )}

          {currentView === 'docs' && (
            <Docs onBack={handleBackToLanding} />
          )}
        </main>
      </div>

      {currentView === 'landing' && <ProgressBar />}
    </div>
  );
}

function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[3px] z-50 bg-white/[0.03]">
      <div
        className="w-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 rounded-full"
        style={{ height: `${progress}%`, transition: 'height 0.05s linear' }}
      />
    </div>
  );
}

export default App;

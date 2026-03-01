import { useState, useEffect, useRef } from 'react';
import { Brain, Menu, X } from 'lucide-react';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';

interface NavigationProps {
  onGetStarted: () => void;
}

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navigation({ onGetStarted }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Entrance animation
  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(navRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: 'power3.out' }
    );
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveLink(href);
    setIsMobileMenuOpen(false);
  };

  // Update active indicator position
  useEffect(() => {
    if (!indicatorRef.current || !activeLink) return;
    const activeBtn = document.querySelector(`[data-nav-href="${activeLink}"]`) as HTMLElement;
    if (activeBtn) {
      const rect = activeBtn.getBoundingClientRect();
      const parentRect = activeBtn.parentElement?.getBoundingClientRect();
      if (parentRect) {
        gsap.to(indicatorRef.current, {
          width: rect.width,
          x: rect.left - parentRect.left,
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    }
  }, [activeLink]);

  return (
    <>
      <nav
        ref={navRef}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 opacity-0',
          isScrolled
            ? 'bg-black/60 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/20'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">Second Brain</span>
            </a>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-1 relative">
              {/* Active indicator */}
              <div
                ref={indicatorRef}
                className="absolute bottom-0 h-0.5 bg-indigo-500 rounded-full opacity-0"
              />
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  data-nav-href={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeLink === link.href
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onGetStarted}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'fixed inset-0 z-40 md:hidden transition-all duration-300',
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
        <div className="relative flex flex-col items-center justify-center h-full gap-6">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollToSection(link.href)}
              className="text-2xl text-white hover:text-indigo-400 transition-colors font-medium"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onGetStarted();
            }}
            className="mt-6 px-8 py-3 rounded-xl bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/25"
          >
            Get Started
          </button>
        </div>
      </div>
    </>
  );
}

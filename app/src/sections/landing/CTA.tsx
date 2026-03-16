import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MagneticButton from '@/components/animations/MagneticButton';
import { ArrowRight, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface CTAProps {
  onGetStarted: () => void;
}

export default function CTA({ onGetStarted }: CTAProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const vortexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !vortexRef.current) return;

    const ctx = gsap.context(() => {
      // Vortex rotation
      gsap.to(vortexRef.current, {
        rotation: 360,
        duration: 60,
        ease: 'none',
        repeat: -1,
      });

      // Content reveal
      const contentEl = sectionRef.current?.querySelector('.cta-content');
      if (contentEl) {
        gsap.fromTo(
          contentEl,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 relative overflow-hidden">
      {/* Vortex background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          ref={vortexRef}
          className="w-[800px] h-[800px] rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(79, 70, 229, 0.1), transparent, rgba(124, 58, 237, 0.1), transparent)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(79, 70, 229, 0.1) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="cta-content text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300">Start your journey today</span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to Build Your{' '}
            <span className="text-gradient">Second Brain?</span>
          </h2>

          {/* Description */}
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of thinkers, creators, and knowledge workers who have 
            transformed how they capture and use information.
          </p>

          {/* CTA Button */}
          <MagneticButton
            onClick={onGetStarted}
            variant="primary"
            size="lg"
            className="group"
            magneticStrength={0.5}
          >
            <Sparkles className="w-5 h-5" />
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </MagneticButton>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              14-day free trial
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

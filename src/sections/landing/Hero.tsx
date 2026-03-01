import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, ArrowRight, Zap, Play } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  onGetStarted: () => void;
}

// Animated counter hook
function useCounter(end: number, duration: number = 2, suffix: string = '') {
  const [display, setDisplay] = useState('0' + suffix);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const obj = { val: 0 };
    const tl = gsap.to(obj, {
      val: end,
      duration,
      ease: 'linear',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        if (end >= 1000) {
          setDisplay(Math.floor(obj.val / 1000) + 'K+');
        } else {
          setDisplay(Math.floor(obj.val) + suffix);
        }
      },
    });

    return () => { tl.kill(); };
  }, [end, duration, suffix]);

  return { display, ref };
}

export default function Hero({ onGetStarted }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const stat1 = useCounter(10000, 2.5, '+');
  const stat2 = useCounter(1000000, 3, '+');
  const stat3 = useCounter(99, 2, '%');

  // Mouse-follow orb
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!orbRef.current) return;
      gsap.to(orbRef.current, {
        x: (e.clientX - window.innerWidth / 2) * 0.04,
        y: (e.clientY - window.innerHeight / 2) * 0.04,
        duration: 1.5,
        ease: 'linear',
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Entrance animations — one-shot timeline on load
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'linear' } });

      // Badge
      if (badgeRef.current) {
        tl.fromTo(badgeRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          0.3
        );
      }

      // Headline — word split
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.hero-word');
        tl.fromTo(words,
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: 'linear' },
          0.5
        );
      }

      // Subtitle
      if (subRef.current) {
        tl.fromTo(subRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          0.9
        );
      }

      // CTA buttons
      if (ctaRef.current) {
        tl.fromTo(ctaRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          1.1
        );
      }

      // Floating particles — gentle continuous drift
      if (particlesRef.current) {
        const dots = particlesRef.current.querySelectorAll('.particle-dot');
        dots.forEach((dot, i) => {
          gsap.to(dot, {
            y: `random(-15, 15)`,
            x: `random(-10, 10)`,
            opacity: `random(0.15, 0.6)`,
            duration: `random(4, 7)`,
            ease: 'linear',
            yoyo: true,
            repeat: -1,
            delay: i * 0.2,
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Click handler with ripple + scale animation before navigating
  const handlePrimaryClick = () => {
    if (!ctaRef.current) {
      onGetStarted();
      return;
    }

    const btn = ctaRef.current.querySelector('.hero-primary-btn') as HTMLElement;
    if (btn) {
      gsap.to(btn, {
        scale: 0.9,
        rotation: -2,
        duration: 0.1,
        ease: 'linear',
        onComplete: () => {
          gsap.to(btn, {
            scale: 1,
            rotation: 0,
            duration: 0.4,
            ease: 'linear',
            clearProps: 'all',
            onComplete: () => {
              onGetStarted();
            },
          });
        },
      });
    } else {
      onGetStarted();
    }
  };

  const headlineWords = ['Build', 'Your', 'Second', 'Brain'];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Gradient orb */}
      <div
        ref={orbRef}
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.08) 40%, transparent 70%)',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Floating particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="particle-dot absolute rounded-full bg-indigo-400/30"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Badge */}
        <div ref={badgeRef} className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 opacity-0">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-indigo-300">AI-Powered Knowledge Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>

        {/* Headline */}
        <h1
          ref={headlineRef}
          className="text-5xl sm:text-6xl lg:text-8xl font-bold text-white mb-8 leading-[1.05]"
        >
          {headlineWords.map((word, i) => (
            <span key={i} className="hero-word inline-block mr-[0.25em] opacity-0">
              {word === 'Second' || word === 'Brain' ? (
                <span className="text-gradient-vibrant">{word}</span>
              ) : (
                word
              )}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p
          ref={subRef}
          className="text-lg sm:text-xl lg:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed opacity-0"
        >
          Capture, organize, and rediscover your knowledge.
          <br className="hidden sm:block" />
          Transform how you think with <span className="text-indigo-300 font-medium">AI-powered intelligence</span>.
        </p>

        {/* CTA */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center opacity-0">
          <button
            onClick={handlePrimaryClick}
            className="hero-primary-btn inline-flex items-center justify-center gap-2.5 px-8 py-4 text-lg font-medium rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 group"
          >
            <Sparkles className="w-5 h-5" />
            Start Building for Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </button>

          <button
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-lg font-medium rounded-xl bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1] hover:border-white/[0.2] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 group"
          >
            <Play className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            Watch Demo
          </button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { counter: stat1, label: 'Active Users' },
            { counter: stat2, label: 'Notes Captured' },
            { counter: stat3, label: 'Satisfaction' },
          ].map((stat, i) => (
            <div key={i} ref={stat.counter.ref} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
                {stat.counter.display}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
    </section>
  );
}

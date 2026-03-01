import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface CTAProps {
  onGetStarted: () => void;
}

export default function CTA({ onGetStarted }: CTAProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Content entrance — scrub-linked
      if (contentRef.current) {
        gsap.fromTo(contentRef.current,
          { y: 60, opacity: 0, scale: 0.95 },
          {
            y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: contentRef.current, start: 'top 80%', toggleActions: 'play none none none' },
          }
        );
      }

      // Floating particles
      if (particlesRef.current) {
        const dots = particlesRef.current.querySelectorAll('.cta-particle');
        dots.forEach((dot, i) => {
          gsap.to(dot, {
            y: `random(-30, 30)`,
            x: `random(-20, 20)`,
            opacity: `random(0.1, 0.5)`,
            duration: `random(4, 8)`,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: i * 0.4,
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.04] to-transparent" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="cta-particle absolute rounded-full bg-indigo-400/20"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              opacity: 0.2,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div
          ref={contentRef}
          className="text-center p-12 sm:p-16 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm relative overflow-hidden"
        >
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-medium text-indigo-300">Start for free — no credit card required</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
              Ready to Build Your
              <br />
              <span className="text-gradient-vibrant">Second Brain?</span>
            </h2>

            {/* Subtitle */}
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Join thousands of thinkers who trust Second Brain to capture, organize, and supercharge their knowledge.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-lg font-medium rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 group"
              >
                <Sparkles className="w-5 h-5" />
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>

              <button
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-lg font-medium rounded-xl bg-white/[0.06] text-white border border-white/[0.12] hover:bg-white/[0.1] hover:border-white/[0.2] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              >
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

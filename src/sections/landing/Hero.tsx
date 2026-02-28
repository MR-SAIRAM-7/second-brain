import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import BrainIcon from '@/components/animations/BrainIcon';
import MagneticButton from '@/components/animations/MagneticButton';
import { Sparkles, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;

    const ctx = gsap.context(() => {
      // Title animation
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { y: 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            delay: 0.3,
            ease: 'power3.out',
          }
        );
      }

      // Description animation
      if (descRef.current) {
        gsap.fromTo(
          descRef.current,
          { filter: 'blur(10px)', opacity: 0 },
          {
            filter: 'blur(0px)',
            opacity: 1,
            duration: 1,
            delay: 0.7,
            ease: 'power2.out',
          }
        );
      }

      // CTA animation
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { scale: 0.8, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            delay: 0.9,
            ease: 'elastic.out(1, 0.5)',
          }
        );
      }

      if (titleRef.current) {
        gsap.to(titleRef.current, {
          letterSpacing: '5px',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '50% top',
            scrub: 1,
          }
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
      >
        {/* Brain Icon */}
        <div className="mb-8 flex justify-center">
          <BrainIcon size={100} />
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 opacity-0"
        >
          Build Your{' '}
          <span className="text-gradient">Second Brain</span>
        </h1>

        {/* Description */}
        <p
          ref={descRef}
          className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 opacity-0"
        >
          Capture, organize, and rediscover your knowledge. Transform the way you
          think and create with AI-powered intelligence.
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center opacity-0">
          <MagneticButton
            onClick={onGetStarted}
            variant="primary"
            size="lg"
            className="group"
          >
            <Sparkles className="w-5 h-5" />
            Start Building for Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </MagneticButton>

          <MagneticButton variant="secondary" size="lg">
            Watch Demo
          </MagneticButton>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { value: '10K+', label: 'Active Users' },
            { value: '1M+', label: 'Notes Captured' },
            { value: '99%', label: 'Satisfaction' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
}

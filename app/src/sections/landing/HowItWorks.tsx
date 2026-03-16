import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FolderPlus, Network, Lightbulb } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    title: 'Capture',
    description: 'Quickly save ideas, articles, and notes. Our intelligent capture system preserves context and source information automatically.',
    icon: FolderPlus,
    color: '#4F46E5',
  },
  {
    number: '02',
    title: 'Organize',
    description: 'AI categorizes your knowledge automatically. Smart tagging and linking create connections you might never have discovered.',
    icon: Network,
    color: '#7C3AED',
  },
  {
    number: '03',
    title: 'Create',
    description: 'Connect ideas and generate new insights. Your second brain becomes a creative partner, surfacing relevant knowledge when you need it.',
    icon: Lightbulb,
    color: '#EC4899',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!sectionRef.current || !containerRef.current) return;

    const ctx = gsap.context(() => {
      // Path draw animation
      if (pathRef.current) {
        const pathLength = pathRef.current.getTotalLength();
        gsap.set(pathRef.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });

        gsap.to(pathRef.current, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 1,
          },
        });
      }

      // Card animations
      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        gsap.fromTo(
          card,
          { scale: 0.8, opacity: 0, y: 50 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
            delay: index * 0.2,
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 lg:py-32 relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Three simple steps to transform the way you manage knowledge
          </p>
        </div>

        {/* Neural pathway SVG */}
        <div className="relative mb-12 hidden lg:block">
          <svg
            className="w-full h-24"
            viewBox="0 0 1200 100"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              ref={pathRef}
              d="M100 50 Q300 50 400 50 Q500 50 600 50 Q700 50 800 50 Q900 50 1100 50"
              stroke="url(#gradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="50%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Pulse dots along the path */}
          {steps.map((_, index) => (
            <div
              key={index}
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-500 animate-pulse-glow"
              style={{ left: `${(index / (steps.length - 1)) * 80 + 10}%` }}
            />
          ))}
        </div>

        {/* Steps grid */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
                className="relative group"
              >
                {/* Card */}
                <div className="relative p-8 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                  {/* Step number */}
                  <div className="absolute -top-4 -left-2 text-6xl font-bold text-white/5 select-none">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${step.color}20` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: step.color }} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${step.color}10, transparent 70%)`,
                    }}
                  />
                </div>

                {/* Connection line (mobile) */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center my-4">
                    <div className="w-px h-8 bg-gradient-to-b from-indigo-500/50 to-transparent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

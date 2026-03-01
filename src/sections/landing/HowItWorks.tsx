import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FolderPlus, Network, Lightbulb, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    title: 'Capture',
    description: 'Quickly save ideas, articles, and notes. Our intelligent capture preserves context and source information automatically.',
    icon: FolderPlus,
    color: '#6366f1',
    gradient: 'from-indigo-500 to-blue-600',
  },
  {
    number: '02',
    title: 'Organize',
    description: 'AI categorizes automatically. Smart tagging and linking create connections you might never have discovered on your own.',
    icon: Network,
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    number: '03',
    title: 'Create',
    description: 'Connect ideas and generate insights. Your second brain surfaces relevant knowledge exactly when you need it most.',
    icon: Lightbulb,
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Heading entrance
      if (headingRef.current) {
        gsap.fromTo(headingRef.current,
          { y: 60, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: headingRef.current, start: 'top 85%', toggleActions: 'play none none none' },
          }
        );
      }

      // Connecting line
      if (lineRef.current) {
        gsap.fromTo(lineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1, duration: 1, ease: 'power3.inOut',
            scrollTrigger: { trigger: lineRef.current, start: 'top 80%', toggleActions: 'play none none none' },
          }
        );
      }

      // Cards — staggered entrance
      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(card,
          { y: 80, opacity: 0, scale: 0.9 },
          {
            y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.03] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headingRef} className="text-center mb-20">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4">Simple Process</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Three simple steps to transform the way you manage knowledge
          </p>
        </div>

        {/* Connecting line — desktop */}
        <div className="hidden lg:block relative mb-8">
          <div
            ref={lineRef}
            className="h-px bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50 mx-auto"
            style={{ width: '70%', transformOrigin: 'left center' }}
          />
          {/* Dots on line */}
          {steps.map((step, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full animate-pulse-glow"
              style={{
                left: `${15 + i * 35}%`,
                backgroundColor: step.color,
                boxShadow: `0 0 12px ${step.color}60`,
              }}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                ref={(el) => { if (el) cardsRef.current[index] = el; }}
                className="relative group"
              >
                <div className="relative p-8 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] hover:border-white/[0.12] transition-all duration-500 hover:bg-white/[0.04]">
                  {/* Step number */}
                  <span className="absolute -top-3 -right-2 text-7xl font-bold text-white/[0.03] select-none pointer-events-none">
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    style={{ boxShadow: `0 8px 30px ${step.color}30` }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-[15px]">{step.description}</p>

                  {/* Learn more */}
                  <div className="mt-6 flex items-center gap-2 text-sm text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${step.color}08, transparent 70%)`,
                    }}
                  />
                </div>

                {/* Mobile connector */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center my-4">
                    <div className="w-px h-8 bg-gradient-to-b from-indigo-500/40 to-transparent" />
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

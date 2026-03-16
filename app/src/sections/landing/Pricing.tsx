import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, Sparkles, Zap, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

const plans = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    period: 'forever',
    icon: Sparkles,
    features: [
      'Up to 100 notes',
      'Basic AI summarization',
      '5 tags per note',
      'Web clipper',
      'Mobile app access',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    description: 'For serious knowledge workers',
    price: 12,
    period: 'month',
    icon: Zap,
    features: [
      'Unlimited notes',
      'Advanced AI features',
      'Unlimited tags',
      'Knowledge graph view',
      'API access',
      'Priority support',
      'Custom integrations',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Team',
    description: 'Collaborate and share knowledge',
    price: 29,
    period: 'user/month',
    icon: Building2,
    features: [
      'Everything in Pro',
      'Team workspaces',
      'Shared knowledge bases',
      'Admin controls',
      'SSO & SAML',
      'Audit logs',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        gsap.fromTo(
          card,
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
            delay: index * 0.15,
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Simple <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Start free, upgrade when you're ready. No credit card required.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
                className="relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Highlighted badge */}
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <span className="px-4 py-1 rounded-full bg-indigo-500 text-white text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    'relative h-full p-8 rounded-2xl transition-all duration-300',
                    plan.highlighted
                      ? 'bg-gradient-to-b from-indigo-500/20 to-transparent border-2 border-indigo-500/50'
                      : 'bg-white/[0.03] border border-white/[0.08] hover:border-white/20',
                    isHovered && 'transform -translate-y-2'
                  )}
                  style={{
                    boxShadow: isHovered
                      ? plan.highlighted
                        ? '0 25px 50px -12px rgba(79, 70, 229, 0.25)'
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                      : 'none',
                  }}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center mb-6',
                      plan.highlighted
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/10 text-gray-400'
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Plan info */}
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check
                          className={cn(
                            'w-5 h-5 flex-shrink-0 mt-0.5',
                            plan.highlighted ? 'text-indigo-400' : 'text-gray-500'
                          )}
                        />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    className={cn(
                      'w-full py-3 px-4 rounded-xl font-medium transition-all duration-300',
                      plan.highlighted
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    )}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise note */}
        <p className="text-center text-gray-500 mt-12">
          Need a custom solution?{' '}
          <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Contact our sales team
          </button>
        </p>
      </div>
    </section>
  );
}

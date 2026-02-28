import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GlassCard from '@/components/animations/GlassCard';
import { FileText, Tags, GitGraph, Search, Sparkles, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: 'AI Summarization',
    description: 'Automatically generate concise summaries of your notes and articles. Save time while preserving key insights.',
    icon: FileText,
    gradient: 'from-blue-500 to-cyan-500',
    preview: (
      <div className="p-4 rounded-lg bg-black/30 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-indigo-400 font-medium">AI Summary</span>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-white/10 rounded w-full" />
          <div className="h-2 bg-white/10 rounded w-4/5" />
          <div className="h-2 bg-white/10 rounded w-3/5" />
        </div>
      </div>
    ),
  },
  {
    title: 'Smart Tagging',
    description: 'AI automatically suggests relevant tags based on content. Build a connected knowledge web without manual effort.',
    icon: Tags,
    gradient: 'from-purple-500 to-pink-500',
    preview: (
      <div className="flex flex-wrap gap-2">
        {['productivity', 'ai', 'learning', 'notes'].map((tag, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
          >
            #{tag}
          </span>
        ))}
        <span className="px-3 py-1 rounded-full text-xs bg-white/5 text-gray-400 border border-white/10 animate-pulse">
          +3 more
        </span>
      </div>
    ),
  },
  {
    title: 'Knowledge Graph',
    description: 'Visualize connections between your ideas. Discover unexpected relationships and spark new creative insights.',
    icon: GitGraph,
    gradient: 'from-emerald-500 to-teal-500',
    preview: (
      <div className="relative h-24">
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <circle cx="50" cy="50" r="8" fill="#4F46E5" />
          <circle cx="100" cy="30" r="6" fill="#7C3AED" />
          <circle cx="150" cy="50" r="8" fill="#EC4899" />
          <circle cx="100" cy="70" r="6" fill="#10B981" />
          <line x1="50" y1="50" x2="100" y2="30" stroke="#4F46E5" strokeWidth="1" opacity="0.5" />
          <line x1="100" y1="30" x2="150" y2="50" stroke="#7C3AED" strokeWidth="1" opacity="0.5" />
          <line x1="50" y1="50" x2="100" y2="70" stroke="#4F46E5" strokeWidth="1" opacity="0.5" />
          <line x1="100" y1="70" x2="150" y2="50" stroke="#10B981" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
    ),
  },
  {
    title: 'Universal Search',
    description: 'Find anything instantly. Search across all your knowledge with semantic understanding, not just keywords.',
    icon: Search,
    gradient: 'from-orange-500 to-red-500',
    preview: (
      <div className="relative">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-black/30 border border-white/10">
          <Search className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">How to build habits...</span>
        </div>
        <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>Found 3 relevant notes</span>
          </div>
        </div>
      </div>
    ),
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Staggered entrance animation
      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        gsap.fromTo(
          card,
          { y: 100, opacity: 0 },
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
      {/* Background mesh gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Powered by <span className="text-gradient">Intelligence</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Advanced AI features that transform raw notes into organized, actionable knowledge
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
              >
                <GlassCard className="h-full p-8" glowColor="rgba(79, 70, 229, 0.2)">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${feature.gradient}`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-6">{feature.preview}</div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

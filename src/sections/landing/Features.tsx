import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import GlassCard from '@/components/animations/GlassCard';
import { FileText, Tags, GitGraph, Search, Sparkles, Zap, Bot } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: 'AI Summarization',
    description: 'Automatically generate concise summaries of notes and articles. Save time while preserving key insights.',
    icon: FileText,
    gradient: 'from-blue-500 to-cyan-500',
    color: '#3b82f6',
    span: 'col-span-1 md:col-span-1',
    preview: (
      <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-indigo-400 font-medium">AI Summary</span>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-white/[0.08] rounded-full w-full" />
          <div className="h-2 bg-white/[0.08] rounded-full w-4/5" />
          <div className="h-2 bg-white/[0.06] rounded-full w-3/5" />
        </div>
      </div>
    ),
  },
  {
    title: 'Smart Auto-Tagging',
    description: 'AI suggests relevant tags based on content analysis. Build a connected knowledge web effortlessly.',
    icon: Tags,
    gradient: 'from-violet-500 to-purple-600',
    color: '#8b5cf6',
    span: 'col-span-1 md:col-span-1',
    preview: (
      <div className="flex flex-wrap gap-2">
        {['productivity', 'ai', 'learning', 'notes'].map((tag, i) => (
          <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-violet-500/15 text-violet-300 border border-violet-500/20 font-medium">
            #{tag}
          </span>
        ))}
        <span className="px-3 py-1.5 rounded-full text-xs bg-white/[0.04] text-gray-500 border border-white/[0.08] animate-pulse">
          + generating...
        </span>
      </div>
    ),
  },
  {
    title: 'Knowledge Graph',
    description: 'Visualize connections between ideas. Discover unexpected relationships and spark creative insights you never knew existed.',
    icon: GitGraph,
    gradient: 'from-emerald-500 to-teal-600',
    color: '#10b981',
    span: 'col-span-1 md:col-span-2',
    preview: (
      <div className="relative h-28">
        <svg className="w-full h-full" viewBox="0 0 400 120">
          {/* Connections */}
          <line x1="80" y1="60" x2="160" y2="35" stroke="#4F46E5" strokeWidth="1.5" opacity="0.4" />
          <line x1="160" y1="35" x2="260" y2="55" stroke="#7C3AED" strokeWidth="1.5" opacity="0.4" />
          <line x1="80" y1="60" x2="160" y2="85" stroke="#4F46E5" strokeWidth="1.5" opacity="0.4" />
          <line x1="160" y1="85" x2="260" y2="55" stroke="#10B981" strokeWidth="1.5" opacity="0.4" />
          <line x1="260" y1="55" x2="340" y2="40" stroke="#EC4899" strokeWidth="1.5" opacity="0.4" />
          <line x1="260" y1="55" x2="340" y2="80" stroke="#F59E0B" strokeWidth="1.5" opacity="0.4" />
          {/* Nodes */}
          <circle cx="80" cy="60" r="10" fill="#4F46E5" opacity="0.8" />
          <circle cx="160" cy="35" r="7" fill="#7C3AED" opacity="0.8" />
          <circle cx="160" cy="85" r="8" fill="#10B981" opacity="0.8" />
          <circle cx="260" cy="55" r="11" fill="#6366f1" opacity="0.8" />
          <circle cx="340" cy="40" r="6" fill="#EC4899" opacity="0.8" />
          <circle cx="340" cy="80" r="7" fill="#F59E0B" opacity="0.8" />
          {/* Glow on center node */}
          <circle cx="260" cy="55" r="18" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.2">
            <animate attributeName="r" values="18;24;18" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.05;0.2" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    ),
  },
  {
    title: 'Conversational AI',
    description: 'Ask questions in natural language and get intelligent answers sourced directly from your personal knowledge base.',
    icon: Bot,
    gradient: 'from-amber-500 to-orange-600',
    color: '#f59e0b',
    span: 'col-span-1 md:col-span-1',
    preview: (
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="px-4 py-2 rounded-2xl rounded-tr-sm bg-indigo-600/80 text-xs text-white max-w-[80%]">
            What did I learn about habits?
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-3 h-3 text-amber-400" />
          </div>
          <div className="px-4 py-2 rounded-2xl rounded-tl-sm bg-white/[0.05] text-xs text-gray-300 max-w-[85%]">
            Based on your notes, you identified 3 key habit-forming strategies...
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Semantic Search',
    description: 'Find anything instantly. Search across all knowledge with deep semantic understanding, not just keyword matching.',
    icon: Search,
    gradient: 'from-rose-500 to-pink-600',
    color: '#f43f5e',
    span: 'col-span-1 md:col-span-1',
    preview: (
      <div className="relative">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-white/[0.06]">
          <Search className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-400">How to build habits...</span>
        </div>
        <div className="mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <Zap className="w-3.5 h-3.5 text-yellow-500" />
            <span>Found 3 semantically relevant notes</span>
          </div>
        </div>
      </div>
    ),
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (headingRef.current) {
        gsap.fromTo(headingRef.current,
          { y: 50, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: headingRef.current, start: 'top 85%', toggleActions: 'play none none none' },
          }
        );
      }

      cardsRef.current.forEach((card) => {
        if (!card) return;
        gsap.fromTo(card,
          { y: 60, opacity: 0, scale: 0.95 },
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
    <section ref={sectionRef} className="py-24 lg:py-32 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/[0.06] rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div ref={headingRef} className="text-center mb-16">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4">Features</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Powered by <span className="text-gradient">Intelligence</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Advanced AI features that transform raw notes into organized, actionable knowledge
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                ref={(el) => { if (el) cardsRef.current[index] = el; }}
                className={feature.span}
              >
                <GlassCard className="h-full p-7 lg:p-8" glowColor={`${feature.color}30`}>
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${feature.gradient} shadow-lg flex-shrink-0`}
                      style={{ boxShadow: `0 6px 20px ${feature.color}30` }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-5">{feature.preview}</div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

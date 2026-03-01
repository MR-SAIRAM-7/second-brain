import { Brain, Sparkles, Shield, Zap, Globe, Code2, Database } from 'lucide-react';

const logos = [
  { name: 'OpenAI', icon: Sparkles },
  { name: 'Google', icon: Brain },
  { name: 'Vercel', icon: Zap },
  { name: 'Supabase', icon: Database },
  { name: 'Cloudflare', icon: Shield },
  { name: 'Next.js', icon: Globe },
  { name: 'TypeScript', icon: Code2 },
  { name: 'React', icon: Sparkles },
];

export default function LogoStream() {
  // Double the logos for seamless infinite scroll
  const doubled = [...logos, ...logos];

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Section label */}
      <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-widest font-medium">
        Built with industry-leading technology
      </p>

      {/* Marquee container */}
      <div className="relative mask-edges">
        <div className="flex gap-12 animate-marquee">
          {doubled.map((logo, i) => {
            const Icon = logo.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex-shrink-0 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 group cursor-default"
              >
                <Icon className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                <span className="text-gray-400 font-medium text-sm whitespace-nowrap group-hover:text-white transition-colors">
                  {logo.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle divider */}
      <div className="mt-16 max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
}

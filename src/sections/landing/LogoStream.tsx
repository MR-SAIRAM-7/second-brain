import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const logos = [
  { name: 'Notion', icon: 'N' },
  { name: 'Obsidian', icon: 'O' },
  { name: 'Evernote', icon: 'E' },
  { name: 'Roam Research', icon: 'R' },
  { name: 'Logseq', icon: 'L' },
  { name: 'Craft', icon: 'C' },
  { name: 'Mem.ai', icon: 'M' },
  { name: 'Reflect', icon: 'Rf' },
];

export default function LogoStream() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(1);

  useEffect(() => {
    if (!sectionRef.current || !trackRef.current) return;

    const ctx = gsap.context(() => {
      // Continuous scroll animation
      const track = trackRef.current;
      if (!track) return;

      const trackWidth = track.scrollWidth / 2;
      
      gsap.to(track, {
        x: -trackWidth,
        duration: 30,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize((x) => parseFloat(x) % trackWidth),
        },
      });

      // Scroll-based speed control
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          speedRef.current = 1 + Math.abs(velocity) / 1000;
          
          gsap.to(track, {
            timeScale: speedRef.current,
            duration: 0.3,
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Duplicate logos for infinite scroll
  const allLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <section
      ref={sectionRef}
      className="py-16 overflow-hidden border-y border-white/5"
    >
      <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-wider">
        Trusted by thinkers and creators
      </p>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        {/* Logo track */}
        <div
          ref={trackRef}
          className="flex gap-16 items-center whitespace-nowrap"
        >
          {allLogos.map((logo, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-gray-500 hover:text-gray-300 transition-colors cursor-default group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg font-bold group-hover:bg-white/10 transition-colors">
                {logo.icon}
              </div>
              <span className="text-lg font-medium">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

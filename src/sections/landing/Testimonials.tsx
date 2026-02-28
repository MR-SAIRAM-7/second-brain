import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Product Manager',
    company: 'Notion',
    content: 'Second Brain has completely transformed how I manage my research and ideas. The AI summarization alone saves me hours every week.',
    avatar: 'SC',
    color: '#4F46E5',
  },
  {
    name: 'Marcus Johnson',
    role: 'Research Scientist',
    company: 'MIT',
    content: 'As someone who deals with massive amounts of academic papers, this tool is a game-changer. The knowledge graph helps me see connections I never would have found.',
    avatar: 'MJ',
    color: '#7C3AED',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Content Creator',
    company: 'YouTube',
    content: 'I use Second Brain to organize all my video ideas and research. The smart tagging means I never lose track of a great idea again.',
    avatar: 'ER',
    color: '#EC4899',
  },
  {
    name: 'David Park',
    role: 'Software Engineer',
    company: 'Google',
    content: 'The conversational query feature is incredible. I can ask my knowledge base questions and get relevant answers from my own notes.',
    avatar: 'DP',
    color: '#10B981',
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = (index: number) => {
    if (isAnimating || index === activeIndex) return;
    setIsAnimating(true);
    setActiveIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const nextSlide = () => {
    goToSlide((activeIndex + 1) % testimonials.length);
  };

  const prevSlide = () => {
    goToSlide((activeIndex - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Loved by <span className="text-gradient">Thinkers</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            See how people are transforming their knowledge workflows
          </p>
        </div>

        {/* Testimonial carousel */}
        <div className="relative">
          {/* Main testimonial */}
          <div className="relative h-[400px] flex items-center justify-center">
            {testimonials.map((testimonial, index) => {
              const isActive = index === activeIndex;
              const isPrev = index === (activeIndex - 1 + testimonials.length) % testimonials.length;
              const isNext = index === (activeIndex + 1) % testimonials.length;

              let transform = 'translateX(100%) scale(0.8)';
              let opacity = 0;
              let zIndex = 0;

              if (isActive) {
                transform = 'translateX(0) scale(1)';
                opacity = 1;
                zIndex = 10;
              } else if (isPrev) {
                transform = 'translateX(-60%) scale(0.85)';
                opacity = 0.5;
                zIndex = 5;
              } else if (isNext) {
                transform = 'translateX(60%) scale(0.85)';
                opacity = 0.5;
                zIndex = 5;
              }

              return (
                <div
                  key={index}
                  className="absolute w-full max-w-2xl transition-all duration-500 ease-out"
                  style={{
                    transform,
                    opacity,
                    zIndex,
                  }}
                >
                  <div className="p-8 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.08]">
                    {/* Quote icon */}
                    <Quote className="w-10 h-10 text-indigo-500/30 mb-4" />

                    {/* Content */}
                    <p className="text-lg text-gray-300 leading-relaxed mb-6">
                      "{testimonial.content}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: testimonial.color }}
                      >
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="text-white font-medium">{testimonial.name}</div>
                        <div className="text-sm text-gray-500">
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              disabled={isAnimating}
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index === activeIndex
                      ? 'w-8 bg-indigo-500'
                      : 'bg-white/20 hover:bg-white/40'
                    }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              disabled={isAnimating}
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

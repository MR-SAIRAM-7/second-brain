import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    question: 'What is Second Brain?',
    answer: 'Second Brain is an AI-powered knowledge management platform that helps you capture, organize, and intelligently surface knowledge. It combines note-taking with AI summarization, auto-tagging, and conversational querying to create a personal knowledge system.',
  },
  {
    question: 'How does AI summarization work?',
    answer: 'When you save a note or article with substantial content, our AI automatically generates a concise 2-3 sentence summary. This happens server-side using advanced language models, so your content never leaves our secure infrastructure.',
  },
  {
    question: 'Can I query my knowledge base conversationally?',
    answer: 'Yes! Use the AI Chat feature to ask natural language questions like "What did I learn about productivity?" and get intelligent answers sourced directly from your notes, with references to the original items.',
  },
  {
    question: 'What technology stack is used?',
    answer: 'The frontend uses React with Vite, Tailwind CSS, GSAP animations, and Three.js for WebGL effects. The backend runs on Node.js/Express with Prisma ORM and PostgreSQL with pgvector for semantic search. AI features are powered by Google Gemini.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. All AI processing happens server-side through secure API calls. Your data is stored in PostgreSQL with encrypted connections. We follow industry best practices for data security and never share your knowledge base with third parties.',
  },
  {
    question: 'Can I integrate Second Brain with other tools?',
    answer: 'Yes! We provide a public REST API at /api/public/brain that supports querying, listing items, and generating summaries. You can also embed our search widget on any website using a simple script tag or React component.',
  },
];

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!contentRef.current) return;

    if (!isOpen) {
      // Open
      gsap.set(contentRef.current, { height: 'auto' });
      const height = contentRef.current.offsetHeight;
      gsap.fromTo(contentRef.current,
        { height: 0, opacity: 0 },
        { height, opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    } else {
      // Close
      gsap.to(contentRef.current, {
        height: 0, opacity: 0, duration: 0.3, ease: 'power2.in',
      });
    }
    setIsOpen(!isOpen);
  };

  // Entrance animation
  useEffect(() => {
    if (!itemRef.current) return;
    gsap.fromTo(itemRef.current,
      { y: 30, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: itemRef.current, start: 'top 90%', toggleActions: 'play none none none' },
      }
    );
  }, [index]);

  return (
    <div
      ref={itemRef}
      className="border-b border-white/[0.06] last:border-b-0"
    >
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between py-5 px-1 text-left group"
      >
        <span className="text-white font-medium text-[15px] sm:text-base group-hover:text-indigo-300 transition-colors pr-4">
          {faq.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`}
        />
      </button>
      <div ref={contentRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
        <p className="text-gray-400 text-sm leading-relaxed pb-5 px-1">
          {faq.answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;
    gsap.fromTo(headingRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: headingRef.current, start: 'top 85%', toggleActions: 'play none none none' },
      }
    );
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headingRef} className="text-center mb-14">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-4">FAQ</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Common <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Everything you need to know about Second Brain
          </p>
        </div>

        {/* FAQ items */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] px-6 sm:px-8 divide-y-0">
          {faqs.map((faq, index) => (
            <FAQItem key={index} faq={faq} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

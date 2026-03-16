import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    question: 'What is a Second Brain?',
    answer: 'A Second Brain is a digital system for capturing, organizing, and retrieving your knowledge. It\'s inspired by Tiago Forte\'s Building a Second Brain methodology, which helps you offload information from your biological brain into a trusted external system, freeing up mental space for creative thinking.',
  },
  {
    question: 'How does the AI summarization work?',
    answer: 'Our AI analyzes your notes and articles to extract key insights and generate concise summaries. It uses advanced natural language processing to understand context and preserve the most important information. You can customize summary length and style to match your preferences.',
  },
  {
    question: 'Can I import my existing notes?',
    answer: 'Absolutely! We support importing from Notion, Evernote, Obsidian, Roam Research, and plain Markdown files. Our import process preserves your existing structure and automatically applies smart tagging to help you discover connections in your existing knowledge.',
  },
  {
    question: 'Is my data secure and private?',
    answer: 'Security is our top priority. All data is encrypted at rest and in transit using industry-standard AES-256 encryption. We never train our AI models on your private content, and you can export or delete your data at any time. We\'re SOC 2 Type II compliant.',
  },
  {
    question: 'What makes this different from other note-taking apps?',
    answer: 'Unlike traditional note-taking apps, Second Brain uses AI to actively help you organize and connect your knowledge. Features like automatic tagging, knowledge graphs, and conversational queries transform your notes from static storage into an intelligent system that surfaces insights when you need them.',
  },
  {
    question: 'Do you offer a free trial for Pro features?',
    answer: 'Yes! Every new account gets a 14-day free trial of Pro features. No credit card required. After the trial, you can choose to upgrade or continue with our generous free plan.',
  },
];

export default function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Frequently <span className="text-gradient">Asked</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to know about Second Brain
          </p>
        </div>

        {/* FAQ list */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={cn(
                  'rounded-xl border transition-all duration-300',
                  isOpen
                    ? 'bg-white/[0.05] border-indigo-500/30'
                    : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20'
                )}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-white font-medium pr-4">{faq.question}</span>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
                      isOpen
                        ? 'bg-indigo-500 text-white rotate-45'
                        : 'bg-white/10 text-gray-400'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </div>
                </button>

                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    isOpen ? 'max-h-96' : 'max-h-0'
                  )}
                >
                  <div className="px-6 pb-6">
                    <div className="h-px bg-white/10 mb-4" />
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-500">
            Still have questions?{' '}
            <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Reach out to our team
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}

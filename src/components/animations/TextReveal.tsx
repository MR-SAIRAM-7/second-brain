import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export default function TextReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.8,
  as: Component = 'h1',
}: TextRevealProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Split text into characters
      const text = children;
      const chars = text.split('').map((char) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        span.style.overflow = 'hidden';
        span.style.opacity = '0';
        span.style.transform = 'translateY(100%)';
        return span;
      });

      containerRef.current!.innerHTML = '';
      chars.forEach((char) => containerRef.current!.appendChild(char));

      // Animate characters
      gsap.to(chars, {
        y: '0%',
        opacity: 1,
        duration,
        stagger: 0.03,
        delay,
        ease: 'power3.out',
      });
    }, containerRef);

    return () => ctx.revert();
  }, [children, delay, duration]);

  return <Component ref={containerRef as React.RefObject<HTMLHeadingElement>} className={className} />;
}

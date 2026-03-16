import { useRef, useEffect, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  magneticStrength?: number;
}

export default function MagneticButton({
  children,
  className = '',
  onClick,
  variant = 'primary',
  size = 'md',
  magneticStrength = 0.3,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!buttonRef.current || !contentRef.current) return;

    const button = buttonRef.current;
    const content = contentRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * magneticStrength;
      const deltaY = (e.clientY - centerY) * magneticStrength;

      gsap.to(button, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: 'power2.out',
      });

      gsap.to(content, {
        x: deltaX * 0.5,
        y: deltaY * 0.5,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)',
      });

      gsap.to(content, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)',
      });
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [magneticStrength]);

  const variantStyles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
    ghost: 'text-white hover:bg-white/5',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={cn(
        'relative rounded-xl font-medium transition-colors duration-200 overflow-hidden group',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {/* Liquid fill effect */}
      <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <span ref={contentRef} className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

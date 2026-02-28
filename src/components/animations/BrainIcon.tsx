import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

interface BrainIconProps {
  size?: number;
  className?: string;
}

export default function BrainIcon({ size = 120, className = '' }: BrainIconProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const ctx = gsap.context(() => {
      // Entrance animation
      gsap.fromTo(
        svgRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out',
        }
      );

      // Continuous float animation
      gsap.to(containerRef.current, {
        y: -10,
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      // Pulse ring animation
      if (pulseRef.current) {
        gsap.to(pulseRef.current, {
          scale: 1.5,
          opacity: 0,
          duration: 2,
          ease: 'power2.out',
          repeat: -1,
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Magnetic hover effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) / 20;
    const deltaY = (e.clientY - centerY) / 20;

    gsap.to(svgRef.current, {
      x: deltaX,
      y: deltaY,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    gsap.to(svgRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.3)',
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ width: size * 1.5, height: size * 1.5 }}
    >
      {/* Pulse ring */}
      <div
        ref={pulseRef}
        className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
        style={{ width: size, height: size, left: '50%', top: '50%', marginLeft: -size/2, marginTop: -size/2 }}
      />
      
      {/* Brain SVG */}
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Brain silhouette */}
        <path
          d="M60 10C35 10 15 30 15 55C15 75 28 92 47 98C50 99 53 100 56 100L56 105C56 108 58 110 60 110C62 110 64 108 64 105L64 100C67 100 70 99 73 98C92 92 105 75 105 55C105 30 85 10 60 10Z"
          fill="#4F46E5"
        />
        
        {/* Brain detail lines */}
        <path
          d="M35 45C35 45 40 35 50 35C60 35 65 45 65 45"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M55 45C55 45 60 35 70 35C80 35 85 45 85 45"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M40 60C40 60 45 55 55 55C65 55 70 60 70 60"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M65 60C65 60 70 55 80 55C90 55 95 60 95 60"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M45 75C45 75 50 70 60 70C70 70 75 75 75 75"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Neural nodes */}
        <circle cx="50" cy="35" r="3" fill="rgba(255,255,255,0.5)" />
        <circle cx="70" cy="35" r="3" fill="rgba(255,255,255,0.5)" />
        <circle cx="55" cy="55" r="3" fill="rgba(255,255,255,0.5)" />
        <circle cx="80" cy="55" r="3" fill="rgba(255,255,255,0.5)" />
        <circle cx="60" cy="70" r="3" fill="rgba(255,255,255,0.5)" />
        
        {/* Glow effect */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* Glow behind */}
      <div 
        className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl"
        style={{ width: size * 0.8, height: size * 0.8, left: '50%', top: '50%', marginLeft: -size*0.4, marginTop: -size*0.4 }}
      />
    </div>
  );
}

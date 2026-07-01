import React from 'react';
import { useState, useEffect, useRef } from 'react';

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useCountUp(
  target: number,
  duration: number = 1800,
  startOnMount: boolean = false
): { value: number; ref: React.RefObject<HTMLElement | null> } {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (startOnMount) {
      animate();
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, startOnMount]);

  function animate() {
    if (target === 0) { setValue(0); return; }

    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  return { value, ref };
}

/** Shorthand component for inline use */
export function AnimatedNumber({ 
  value: target, 
  duration = 1800,
  className,
  style,
}: { 
  value: number | string; 
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Always call hook (rules of hooks: no conditional hook calls)
  const numericTarget = typeof target === 'number' ? target : 0;
  const { value, ref } = useCountUp(numericTarget, duration);

  // If target is a string (like '—'), just render it directly
  if (typeof target === 'string') {
    return <span className={className} style={style}>{target}</span>;
  }

  return <span ref={ref as React.RefObject<HTMLSpanElement>} className={className} style={style}>{value}</span>;
}

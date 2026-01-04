import React, { useEffect, useState, useRef } from 'react';

/**
 * AnimatedCounter Component
 * Animates a number from 0 to target value
 */
const AnimatedCounter = ({ 
  target, 
  duration = 2000, 
  prefix = '', 
  suffix = '',
  className = ''
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const animateCounter = () => {
      const start = 0;
      const increment = target / (duration / 16); // ~60fps
      let current = start;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, 16);

      return () => clearInterval(timer);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCounter();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [hasAnimated, target, duration, suffix]);

  // Format number with commas or K format
  const formatNumber = (num) => {
    if (typeof num === 'string') {
      return num; // Return as-is for strings
    }
    
    // If suffix contains 'K', divide by 1000
    if (suffix && suffix.includes('K')) {
      const kValue = Math.floor(num / 1000);
      return kValue.toLocaleString('en-US');
    }
    
    return num.toLocaleString('en-US');
  };

  // Determine if we should show animated count or final value
  const displayValue = hasAnimated ? count : 0;

  return (
    <span ref={elementRef} className={className}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  );
};

export default AnimatedCounter;

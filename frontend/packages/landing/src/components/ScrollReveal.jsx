import React, { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal Component
 * Reveals content when it scrolls into view
 */
const ScrollReveal = ({ 
  children, 
  direction = 'up', 
  delay = 0,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay]);

  const directions = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
  };

  const baseClasses = `transition-all duration-700 ease-out ${
    isVisible 
      ? 'opacity-100 translate-x-0 translate-y-0' 
      : `opacity-0 ${directions[direction]}`
  }`;

  return (
    <div ref={elementRef} className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};

export default ScrollReveal;

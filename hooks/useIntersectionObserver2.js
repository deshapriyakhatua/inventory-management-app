import React, { useEffect } from 'react';

// Intersection Observer Hook
const useIntersectionObserver2 = (elementRef, onIntersect) => {
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        onIntersect(); // Trigger on intersect
      }
    });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [elementRef, onIntersect]);
};

export default useIntersectionObserver2;
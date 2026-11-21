import { useEffect, useRef, useState } from 'react';

/** The width of an element, following its size. Uses a fallback where it cannot be measured. */
export const useWidth = <T extends HTMLElement>(fallback: number) => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
};

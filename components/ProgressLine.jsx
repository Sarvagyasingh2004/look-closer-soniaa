'use client';

import { useEffect, useRef } from 'react';

// A 2px line across the top that fills as you move through the page.
export default function ProgressLine() {
  const fill = useRef(null);
  useEffect(() => {
    let id;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (fill.current) fill.current.style.transform = `scaleX(${p.toFixed(4)})`;
      id = requestAnimationFrame(update);
    };
    id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="progress" aria-hidden="true">
      <div className="progress-fill" ref={fill} />
    </div>
  );
}

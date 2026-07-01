"use client";

import { useEffect, useState } from "react";

export function BlogReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setProgress(scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed left-0 right-0 top-[calc(var(--header-height)+env(safe-area-inset-top,0px))] z-50 h-0.5 bg-dark-border"
      aria-hidden
    >
      <div
        className="h-full bg-neon transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

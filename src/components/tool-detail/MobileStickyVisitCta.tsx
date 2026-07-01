"use client";

import { useEffect, useRef, useState } from "react";
import { BOTTOM_CHROME_VARS, setBottomChromeHeight } from "@/lib/bottom-chrome";

interface MobileStickyVisitCtaProps {
  slug: string;
  name: string;
  observeId?: string;
}

export function MobileStickyVisitCta({
  slug,
  name,
  observeId = "tool-visit-top",
}: MobileStickyVisitCtaProps) {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.getElementById(observeId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [observeId]);

  useEffect(() => {
    if (!visible) {
      setBottomChromeHeight(BOTTOM_CHROME_VARS.mobileCta, 0);
      return;
    }

    const el = barRef.current;
    if (!el) return;

    function updateHeight() {
      setBottomChromeHeight(BOTTOM_CHROME_VARS.mobileCta, el?.offsetHeight ?? 0);
    }

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);

    return () => {
      observer.disconnect();
      setBottomChromeHeight(BOTTOM_CHROME_VARS.mobileCta, 0);
    };
  }, [visible]);

  return (
    <div
      ref={barRef}
      className={`fixed inset-x-0 z-40 border-t border-dark-border bg-dark/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 ease-out motion-reduce:transition-none sm:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      style={{ bottom: "var(--cookie-notice-height, 0px)" }}
      aria-hidden={!visible}
    >
      <a href={`/go/${slug}`} className="btn-primary w-full truncate">
        Visit {name}
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
}

"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

export type ScrollRevealVariant =
  | "fade-up"
  | "fade-in"
  | "fade-down"
  | "slide-left"
  | "slide-right"
  | "scale-in";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: ScrollRevealVariant;
  delay?: number;
  /** Play on mount — for above-the-fold hero content */
  eager?: boolean;
  /** Skip animation entirely (e.g. first row of a grid) */
  disabled?: boolean;
  as?: ElementType;
}

function isInViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
}

export function ScrollReveal({
  children,
  className = "",
  id,
  variant = "fade-up",
  delay = 0,
  eager = false,
  disabled = false,
  as: Component = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(disabled);

  useLayoutEffect(() => {
    if (disabled) {
      setVisible(true);
      return;
    }

    if (eager) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }

    const el = ref.current;
    if (!el) return;

    if (isInViewport(el)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px 5% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled, eager]);

  const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;

  if (disabled) {
    return (
      <Component ref={ref} id={id} className={className}>
        {children}
      </Component>
    );
  }

  return (
    <Component
      ref={ref}
      id={id}
      className={`scroll-reveal scroll-reveal-${variant} ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </Component>
  );
}

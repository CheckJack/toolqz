"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "methodology", label: "How we tested" },
  { id: "comparison", label: "Compare apps" },
  { id: "review-notion", label: "Notion" },
  { id: "review-todoist", label: "Todoist" },
  { id: "review-figma", label: "Figma" },
  { id: "review-canva", label: "Canva" },
  { id: "review-headspace", label: "Headspace" },
  { id: "stacks", label: "Build your stack" },
  { id: "faq", label: "FAQ" },
];

export function BlogGuideToc() {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Guide sections"
      className="surface rounded-xl border border-dark-border p-5 sm:p-6"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
        Jump to section
      </p>
      <ol className="mt-4 space-y-1">
        {sections.map((section, index) => {
          const isActive = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-2 py-2.5 text-[14px] transition-colors ${
                  isActive
                    ? "bg-neon/10 font-medium text-neon"
                    : "text-muted hover-subtle hover:text-white"
                }`}
              >
                <span className="w-5 shrink-0 text-[12px] tabular-nums text-muted-dim">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

"use client";

import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { SearchBar } from "@/components/SearchBar";

interface HeroSectionProps {
  toolCount: number;
  categoryCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function HeroSection({
  toolCount,
  categoryCount,
  searchQuery,
  onSearchChange,
}: HeroSectionProps) {
  return (
    <section className="w-full pb-8 sm:pb-10">
      <div className="relative mx-auto max-w-6xl px-5 pt-[calc(var(--header-height)+env(safe-area-inset-top,0px)+2.75rem)] sm:px-8 sm:pt-[calc(var(--header-height)+env(safe-area-inset-top,0px)+4rem)]">
        <ScrollReveal eager className="mx-auto max-w-2xl text-center">
          <h1 className="text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.75rem] sm:leading-[1.1]">
            Discover life-hack tools
            <br />
            <span className="text-muted">worth your time</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md px-2 text-[15px] leading-relaxed text-muted">
            We test every tool before it makes the list. Honest pricing, clear pros and cons, and
            picks we&apos;d actually use.
          </p>

          <p className="mt-3 text-[13px] text-muted-dim">
            {toolCount} tools across {categoryCount} categories
          </p>
        </ScrollReveal>

        <ScrollReveal eager delay={100} variant="scale-in" className="relative mx-auto mt-6 max-w-xl sm:mt-8">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            variant="hero"
            id="hero-search"
          />
        </ScrollReveal>
      </div>
    </section>
  );
}

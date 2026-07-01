"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { getCategoryLabel } from "@/lib/websites";
import type { GuideStack } from "@/data/blog-guides/productivity-apps-2026";
import type { Website } from "@/types";

export function BlogStackPicker({
  stacks,
  tools,
}: {
  stacks: GuideStack[];
  tools: Record<string, Website>;
}) {
  const [active, setActive] = useState(stacks[0]?.id ?? "");

  const current = stacks.find((s) => s.id === active) ?? stacks[0];

  return (
    <ScrollReveal as="section" className="my-12">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
        Build your stack
      </p>
      <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.75rem]">
        Which setup fits you?
      </h2>
      <p className="mt-3 max-w-2xl text-muted">
        You don&apos;t need all five apps. Pick a profile to see what we&apos;d install first.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {stacks.map((stack) => (
          <button
            key={stack.id}
            type="button"
            onClick={() => setActive(stack.id)}
            className={`min-h-11 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-colors ${
              active === stack.id
                ? "border-neon/40 bg-neon/10 text-neon"
                : "border-dark-border text-muted hover:border-white/20 hover:text-white"
            }`}
          >
            {stack.label}
          </button>
        ))}
      </div>

      {current && (
        <div className="surface mt-6 rounded-xl border border-dark-border p-5 sm:p-6">
          <p className="text-[15px] text-muted">{current.description}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {current.toolSlugs.map((slug) => {
              const tool = tools[slug];
              if (!tool) return null;
              const image = tool.screenshots[0];
              return (
                <Link
                  key={slug}
                  href={`/tools/${slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-dark-border bg-dark-elevated/50 p-3 transition-colors hover:border-white/15"
                >
                  {image && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-dark-surface">
                      <Image
                        src={image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-white group-hover:text-neon">
                      {tool.name}
                    </p>
                    <p className="truncate text-[12px] text-muted-dim">
                      {getCategoryLabel(tool.category)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </ScrollReveal>
  );
}

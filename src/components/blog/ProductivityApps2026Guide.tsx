import Link from "next/link";
import { BlogComparisonMatrix } from "@/components/blog/BlogComparisonMatrix";
import { BlogReadingProgress } from "@/components/blog/BlogReadingProgress";
import { BlogStackPicker } from "@/components/blog/BlogStackPicker";
import { BlogToolReviewBlock } from "@/components/blog/BlogToolReviewBlock";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { FaqAccordion } from "@/components/tool-detail/FaqAccordion";
import { productivityApps2026Guide } from "@/data/blog-guides/productivity-apps-2026";
import { getWebsiteBySlug } from "@/lib/websites";
import type { Website } from "@/types";

export async function ProductivityApps2026Guide() {
  const guide = productivityApps2026Guide;
  const slugs = [
    ...guide.comparison.map((r) => r.slug),
    ...guide.reviews.map((r) => r.slug),
  ];
  const uniqueSlugs = [...new Set(slugs)];

  const entries = await Promise.all(
    uniqueSlugs.map(async (slug) => [slug, await getWebsiteBySlug(slug)] as const)
  );
  const tools = Object.fromEntries(
    entries.filter(([, t]) => t != null)
  ) as Record<string, Website>;

  return (
    <>
      <BlogReadingProgress />

      <ScrollReveal eager variant="fade-in" className="mb-8 flex flex-wrap items-center gap-3 text-[13px] text-muted-dim">
        <span className="rounded-full border border-dark-border px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-muted">
          {guide.readingTimeMinutes} min read
        </span>
        <span>{guide.appsTested} apps tested</span>
        <span aria-hidden>·</span>
        <span>Updated {guide.lastUpdated}</span>
      </ScrollReveal>

      <ScrollReveal variant="scale-in" className="rounded-xl border border-neon/20 bg-neon/[0.04] px-5 py-5 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neon">Bottom line</p>
        <p className="mt-2 text-[16px] leading-relaxed text-white sm:text-[17px]">
          {guide.bottomLine}
        </p>
      </ScrollReveal>

      <ScrollReveal className="mt-8 space-y-5 text-[16px] leading-[1.75] text-muted sm:text-[17px]">
        {guide.intro.split("\n\n").map((para, i) => (
          <p key={i}>
            {para.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
              part.startsWith("**") ? (
                <strong key={j} className="font-medium text-white">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        ))}
      </ScrollReveal>

      <ScrollReveal as="section" id="methodology" className="my-12 scroll-mt-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
          Methodology
        </p>
        <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.75rem]">
          How we tested these apps
        </h2>
        <div className="mt-5 space-y-4 text-[16px] leading-[1.75] text-muted">
          <p>
            Every app below follows the process we document in{" "}
            <Link href="/blog/how-we-test-digital-tools" className="text-neon hover:underline">
              how we test digital tools
            </Link>
            . Real signups, real workflows, pricing pages read before checkout — no vendor demos.
          </p>
          <p>
            We only recommend tools that already have a full write-up in our{" "}
            <Link href="/?category=productivity" className="text-neon hover:underline">
              productivity directory
            </Link>
            . That means pros, cons, pricing tables, and FAQs you can verify yourself.
          </p>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            "One primary job done clearly",
            "Pricing understandable in 60 seconds",
            "Mobile that doesn't feel broken",
            "Hands-on review on TOOLQZ",
          ].map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-lg border border-dark-border bg-dark-elevated/30 px-4 py-3 text-[14px] text-muted"
            >
              <span className="text-neon" aria-hidden>✓</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[14px] text-muted">
          Read our full editorial policy on{" "}
          <Link href="/how-we-pick" className="text-neon hover:underline">
            how we pick tools
          </Link>
          .
        </p>
      </ScrollReveal>

      <BlogComparisonMatrix rows={guide.comparison} tools={tools} />

      <ScrollReveal as="section" className="my-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
          In-depth reviews
        </p>
        <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.75rem]">
          The five apps worth your time
        </h2>
      </ScrollReveal>

      {guide.reviews.map((review) => {
        const tool = tools[review.slug];
        if (!tool) return null;
        return <BlogToolReviewBlock key={review.slug} review={review} tool={tool} />;
      })}

      <ScrollReveal id="stacks" className="scroll-mt-24">
        <BlogStackPicker stacks={guide.stacks} tools={tools} />
      </ScrollReveal>

      <ScrollReveal as="section" id="faq" className="my-12 scroll-mt-24 border-t border-dark-border pt-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
          FAQ
        </p>
        <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.75rem]">
          Common questions
        </h2>
        <div className="mt-6">
          <FaqAccordion
            items={guide.faqs.map((f) => ({
              question: f.question,
              answer: f.answer,
            }))}
          />
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" variant="scale-in" className="mt-12 rounded-xl border border-dark-border bg-dark-elevated/30 p-6 text-center sm:p-8">
        <h2 className="text-[1.25rem] font-semibold text-white">Explore the full directory</h2>
        <p className="mx-auto mt-2 max-w-lg text-[15px] text-muted">
          These five apps are a starting point. Browse every tool we&apos;ve tested on TOOLQZ.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary px-5 py-2.5 text-[13px]">
            Browse all tools
          </Link>
          <Link
            href="/blog/how-we-test-digital-tools"
            className="btn-ghost border border-dark-border px-5 py-2.5 text-[13px]"
          >
            How we test tools
          </Link>
        </div>
      </ScrollReveal>
    </>
  );
}

export function productivityAppsFaqJsonLd() {
  const guide = productivityApps2026Guide;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

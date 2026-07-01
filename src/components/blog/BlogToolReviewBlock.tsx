import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import type { GuideToolReview } from "@/data/blog-guides/productivity-apps-2026";
import { getCategoryLabel } from "@/lib/websites";
import type { Website } from "@/types";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-muted-dim">{label}</span>
        <span className="font-medium text-white">{value}/10</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-dark-elevated">
        <div
          className="h-full rounded-full bg-neon transition-all"
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

export function BlogToolReviewBlock({
  review,
  tool,
}: {
  review: GuideToolReview;
  tool: Website;
}) {
  const image = tool.screenshots[0];
  const sectionId = `review-${tool.slug}`;

  return (
    <ScrollReveal as="section" id={sectionId} className="scroll-mt-24 border-t border-dark-border py-12 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neon/10 text-[13px] font-semibold text-neon">
          {review.rank}
        </span>
        <span className="rounded-full border border-dark-border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">
          {review.badge}
        </span>
        {tool.rating && (
          <span className="text-[13px] text-neon">{tool.rating.toFixed(1)} / 5 TOOLQZ score</span>
        )}
      </div>

      <h2 className="mt-4 text-[1.5rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[1.875rem]">
        <Link href={`/tools/${tool.slug}`} className="transition-colors hover:text-neon">
          {tool.name}
        </Link>
        <span className="mt-1 block text-[1.125rem] font-normal text-muted sm:text-[1.25rem]">
          {review.headline}
        </span>
      </h2>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {image && (
          <Link
            href={`/tools/${tool.slug}`}
            className="relative block aspect-[16/10] overflow-hidden rounded-xl bg-dark-surface lg:aspect-square"
          >
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="280px"
              unoptimized
            />
          </Link>
        )}

        <div className="space-y-5">
          <div className="rounded-xl border border-dark-border bg-dark-elevated/40 p-4 sm:p-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-neon">
              How we tested · {review.testingDays} days
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-white">{review.scenario}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {review.scores.map((score) => (
              <ScoreBar key={score.label} label={score.label} value={score.value} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4 text-[16px] leading-[1.75] text-muted sm:text-[17px]">
        {review.narrative.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-dark-border p-4 sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">What we liked</p>
          <ul className="mt-3 space-y-2">
            {tool.pros.slice(0, 4).map((pro) => (
              <li key={pro} className="flex gap-2 text-[14px] text-muted">
                <span className="text-neon" aria-hidden>✓</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-dark-border p-4 sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Watch out for</p>
          <ul className="mt-3 space-y-2">
            {tool.cons.slice(0, 4).map((con) => (
              <li key={con} className="flex gap-2 text-[14px] text-muted">
                <span className="text-muted-dim" aria-hidden>—</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {tool.pricing[0] && (
        <p className="mt-6 text-[14px] text-muted">
          <span className="text-muted-dim">Pricing: </span>
          {tool.pricing.map((p, i) => (
            <span key={p.label}>
              {i > 0 && " · "}
              <strong className="font-medium text-white">{p.label}</strong> {p.price}
            </span>
          ))}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-neon/15 bg-neon/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-white">Our verdict</p>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">{review.verdict}</p>
          <p className="mt-2 text-[13px] text-muted-dim">
            <span className="text-muted">Skip if: </span>
            {review.skipIf}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link href={`/tools/${tool.slug}`} className="btn-primary w-full px-5 py-2.5 text-[13px] sm:w-auto sm:whitespace-nowrap">
            Full {tool.name} review
          </Link>
          <a href={`/go/${tool.slug}`} className="inline-flex min-h-11 items-center justify-center text-[13px] text-muted transition-colors hover:text-white">
            Visit {tool.name} →
          </a>
        </div>
      </div>

      <p className="mt-3 text-[12px] text-muted-dim">
        {getCategoryLabel(tool.category)} · Last reviewed {tool.lastReviewed ?? "2026"}
      </p>
    </ScrollReveal>
  );
}

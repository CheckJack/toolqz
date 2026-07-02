import Link from "next/link";
import { PartnerMarquee } from "@/components/partnerships/PartnerMarquee";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { showcasePartners } from "@/data/partners";

export function PartnershipsHero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-12 sm:pt-14 sm:pb-16">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[380px] w-[min(100%,720px)] -translate-x-1/2 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--hero-glow) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
        <ScrollReveal eager className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
            Partnerships
          </p>

          <h1 className="mt-4 text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.75rem]">
            Grow with a directory
            <br />
            <span className="text-muted">readers actually trust</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-[16px]">
            We partner with products we&apos;d recommend anyway — editorial reviews, honest
            disclosure, and promotion to people actively looking for better tools.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="#get-in-touch" className="btn-primary w-full sm:w-auto">
              Start a conversation
            </Link>
            <Link href="/how-we-pick" className="btn-ghost w-full sm:w-auto">
              How we pick tools
            </Link>
          </div>
        </ScrollReveal>
      </div>

      {showcasePartners.length > 0 && (
        <ScrollReveal delay={160} className="mt-12 sm:mt-14">
          <PartnerMarquee partners={showcasePartners} />
        </ScrollReveal>
      )}
    </section>
  );
}

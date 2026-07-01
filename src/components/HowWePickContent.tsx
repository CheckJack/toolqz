import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { SectionHeader } from "@/components/SectionHeader";
import {
  reviewPillars,
  reviewSteps,
  weDontList,
} from "@/data/how-we-pick";

export function HowWePickContent({ toolCount }: { toolCount: number }) {
  return (
    <div className="space-y-16 sm:space-y-20">
      <ScrollReveal as="header" eager className="max-w-2xl">
        <h1 className="text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.5rem]">
          How we pick tools
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[16px]">
          TOOLQZ isn&apos;t a scraped directory. Every listing goes through our review process
          before it appears on the site — with clear affiliate disclosure throughout.
        </p>
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader
          title="What we stand by"
          description="Three principles behind every listing on TOOLQZ."
          className="mb-6"
        />
        <ul className="grid gap-4 sm:grid-cols-3">
          {reviewPillars.map((item, i) => (
            <ScrollReveal as="li" key={item.title} delay={i * 80} variant="fade-up">
              <div className="surface h-full rounded-xl p-5 sm:p-6">
                <span className="text-[13px] font-medium tabular-nums text-neon">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-3 text-[15px] font-medium text-white">{item.title}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </ul>
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader
          title="Our review workflow"
          description="From first look to published listing — what happens behind every TOOLQZ review."
          className="mb-8"
        />
        <ol className="relative space-y-0">
          {reviewSteps.map((item, i) => (
            <ScrollReveal
              as="li"
              key={item.step}
              delay={i * 90}
              variant="slide-right"
              className="relative flex gap-5 pb-10 last:pb-0 sm:gap-6"
            >
              {i < reviewSteps.length - 1 && (
                <span
                  className="absolute left-[15px] top-8 hidden h-[calc(100%-2rem)] w-px bg-dark-border sm:block"
                  aria-hidden
                />
              )}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neon/30 bg-neon/10 text-[12px] font-medium tabular-nums text-neon">
                {item.step}
              </span>
              <div className="surface flex-1 rounded-xl p-5 sm:p-6">
                <h3 className="text-[15px] font-medium text-white">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </ol>
      </ScrollReveal>

      <ScrollReveal as="section" variant="scale-in" className="surface rounded-xl p-6 sm:p-8">
        <h2 className="text-xl font-medium tracking-[-0.02em] text-white">
          What we don&apos;t list
        </h2>
        <p className="mt-2 max-w-lg text-[14px] text-muted">
          We&apos;d rather have a shorter directory than pad it with untested or low-trust products.
        </p>
        <ul className="mt-6 space-y-3">
          {weDontList.map((item) => (
            <li key={item} className="flex gap-3 text-[14px] leading-relaxed text-muted">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neon" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </ScrollReveal>

      <ScrollReveal
        as="section"
        variant="fade-up"
        className="rounded-xl border border-neon/20 bg-neon/[0.04] p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8"
      >
        <div className="max-w-lg">
          <h2 className="text-xl font-medium text-white">Building something worth listing?</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            If you run a product or service and want TOOLQZ to review or promote it,
            get in touch — especially if you have an affiliate or partnership program.
          </p>
        </div>
        <Link href="/work-with-us" className="btn-primary mt-5 w-full shrink-0 md:mt-0 md:w-auto">
          Partnerships
        </Link>
      </ScrollReveal>

      <ScrollReveal variant="fade-in">
        <p className="text-center text-[13px] text-muted-dim">
          {toolCount}+ tools reviewed across productivity, finance, food, and more.
        </p>
      </ScrollReveal>
    </div>
  );
}

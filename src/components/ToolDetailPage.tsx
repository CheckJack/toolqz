import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { SectionHeader } from "@/components/SectionHeader";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WebsiteCard } from "@/components/WebsiteCard";
import { CategoryDisclaimer } from "@/components/tool-detail/CategoryDisclaimer";
import { FaqAccordion } from "@/components/tool-detail/FaqAccordion";
import { MobileStickyVisitCta } from "@/components/tool-detail/MobileStickyVisitCta";
import { ScreenshotGallery } from "@/components/tool-detail/ScreenshotGallery";
import { ToolLogo } from "@/components/tool-detail/ToolLogo";
import { getCategoryLabel, getDomain } from "@/lib/websites";
import { Website } from "@/types";

interface ToolDetailPageProps {
  website: Website;
  related: Website[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg className="h-5 w-5 text-neon" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="text-lg font-semibold text-white">{rating.toFixed(1)}</span>
      <span className="text-sm text-muted">/ 5</span>
    </div>
  );
}

function VisitButton({
  slug,
  name,
  className = "",
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  return (
    <a href={`/go/${slug}`} className={`btn-primary ${className}`}>
      Visit {name}
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

function AffiliateDisclosure() {
  return (
    <p className="text-xs leading-relaxed text-muted">
      Some links are affiliate links. We may earn a commission at no extra cost to you.
    </p>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return <SectionHeader title={title} description={subtitle} className="mb-5" />;
}

export function ToolDetailPage({ website, related }: ToolDetailPageProps) {
  const domain = getDomain(website.url);

  return (
    <>
      <Header />
      <main className="page-bottom-padding-lg px-5 pt-6 sm:px-8 sm:pt-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to search
          </Link>

          <ScrollReveal as="section" className="mb-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <ToolLogo name={website.name} logoUrl={website.logoUrl} />
                <div className="min-w-0">
                  <p className="mb-2 text-[13px] text-muted">
                    {getCategoryLabel(website.category)}
                    {website.featured && " · Editor's pick"}
                  </p>
                  <h1 className="break-words text-2xl font-medium tracking-[-0.02em] text-white sm:text-3xl">
                    {website.name}
                  </h1>
                  <p className="mt-1.5 text-[13px] text-muted-dim">{domain}</p>
                </div>
              </div>
              {website.rating && <StarRating rating={website.rating} />}
            </div>

            <p className="mt-6 text-[16px] leading-relaxed text-white/90">{website.description}</p>
            <div id="tool-visit-top" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <VisitButton slug={website.slug} name={website.name} className="w-full sm:w-auto" />
              <AffiliateDisclosure />
            </div>
          </ScrollReveal>

          <ScrollReveal as="section" className="mb-10">
            <ScreenshotGallery screenshots={website.screenshots} name={website.name} />
          </ScrollReveal>

          <ScrollReveal as="section" className="mb-10">
            <CategoryDisclaimer category={website.category} />
          </ScrollReveal>

          <ScrollReveal as="section" className="mb-10">
            <SectionHeading title="Who it's for" />
            <p className="text-base leading-relaxed text-muted sm:text-lg">{website.whoIsItFor}</p>
            {website.notForYouIf && (
              <p className="mt-4 rounded-xl border border-dark-border bg-dark p-4 text-sm leading-relaxed text-muted">
                <span className="font-medium text-white">Not for you if: </span>
                {website.notForYouIf}
              </p>
            )}
          </ScrollReveal>

          <ScrollReveal as="section" className="mb-10">
            <SectionHeading title="How it works" subtitle="Three steps to get started" />
            <ol className="space-y-4">
              {website.howItWorks.map((step) => (
                <li
                  key={step.step}
                  className="surface flex gap-4 rounded-lg p-4 sm:p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neon font-mono text-sm font-bold text-ink">
                    {step.step}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted sm:text-base">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollReveal>

          <ScrollReveal as="section" className="mb-10">
            <SectionHeading title="Key features" subtitle="What stood out in our review" />
            <ul className="grid gap-3 sm:grid-cols-2">
              {website.highlights.map((highlight) => (
                <li
                  key={highlight}
                  className="surface flex items-start gap-3 rounded-lg px-4 py-3"
                >
                  <span className="mt-0.5 font-mono text-xs text-neon">+</span>
                  <span className="text-sm leading-relaxed text-white sm:text-base">{highlight}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal as="section" className="mb-10">
            <SectionHeading
              title="Pricing snapshot"
              subtitle="Typical plans — check the official site for current offers"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {website.pricing.map((tier) => (
                <div key={tier.label} className="surface rounded-lg p-4">
                  <p className="text-sm font-medium text-neon">{tier.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{tier.price}</p>
                  {tier.note && (
                    <p className="mt-2 text-xs leading-relaxed text-muted">{tier.note}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal as="section" className="mb-10">
            <SectionHeading title="Pros & cons" subtitle="Honest take from TOOLQZ" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="surface rounded-lg p-5">
                <h3 className="mb-4 text-[15px] font-medium text-white">Pros</h3>
                <ul className="space-y-2">
                  {website.pros.map((pro) => (
                    <li key={pro} className="flex gap-2 text-sm leading-relaxed text-muted">
                      <span className="text-neon">+</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="surface rounded-lg p-5">
                <h3 className="mb-4 text-[15px] font-medium text-white">Cons</h3>
                <ul className="space-y-2">
                  {website.cons.map((con) => (
                    <li key={con} className="flex gap-2 text-sm leading-relaxed text-muted">
                      <span className="text-red-400">−</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal as="section" className="mb-10">
            <SectionHeading title="FAQ" subtitle="Common questions before you sign up" />
            <FaqAccordion items={website.faq} />
          </ScrollReveal>

          <ScrollReveal as="section" variant="scale-in" className="surface mb-10 rounded-xl p-6 sm:p-8">
            <SectionHeading title="Why TOOLQZ recommends it" />
            <p className="mb-6 text-base leading-relaxed text-muted sm:text-lg">{website.overview}</p>
            <ul className="mb-6 space-y-2">
              {website.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-muted">
                  <span className="text-neon">→</span>
                  {h}
                </li>
              ))}
            </ul>
            {website.lastReviewed && (
              <p className="text-xs text-muted">
                Last reviewed by TOOLQZ:{" "}
                {new Date(website.lastReviewed).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            <div className="mt-6 space-y-3">
              <VisitButton slug={website.slug} name={website.name} className="w-full sm:w-auto" />
              <AffiliateDisclosure />
            </div>
          </ScrollReveal>

          <ScrollReveal as="section" className="mb-10">
            <SectionHeading title="Tags" />
            <div className="flex flex-wrap gap-2">
              {website.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-dark-border bg-dark-elevated px-3 py-1 text-sm text-muted"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </ScrollReveal>

          {related.length > 0 && (
            <ScrollReveal as="section" className="mb-10">
              <SectionHeading title={`More in ${getCategoryLabel(website.category)}`} />
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map((site, index) => (
                  <WebsiteCard key={site.id} website={site} index={index} />
                ))}
              </div>
            </ScrollReveal>
          )}

          <ScrollReveal as="section" variant="scale-in" className="surface rounded-xl p-6 text-center sm:p-8">
            <h2 className="text-lg font-medium text-white">Ready to try {website.name}?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              We tested {website.name} so you can decide with confidence before signing up.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <VisitButton slug={website.slug} name={website.name} />
              <AffiliateDisclosure />
            </div>
          </ScrollReveal>
        </div>
      </main>

      <MobileStickyVisitCta slug={website.slug} name={website.name} />

      <Footer />
    </>
  );
}

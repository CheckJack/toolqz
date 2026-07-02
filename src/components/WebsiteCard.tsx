import Image from "next/image";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ToolDetailLink } from "@/components/ToolDetailLink";
import { ToolLogo } from "@/components/tool-detail/ToolLogo";
import { formatReviewed, getPricingHint } from "@/lib/homepage";
import { getCategoryLabel, getDomain } from "@/lib/websites";
import { Website } from "@/types";

interface WebsiteCardProps {
  website: Website;
  index?: number;
  trackNewsletterIntent?: boolean;
}

export function WebsiteCard({ website, index = 0, trackNewsletterIntent = false }: WebsiteCardProps) {
  const domain = getDomain(website.url);
  const pricingHint = getPricingHint(website);
  const reviewed = formatReviewed(website.lastReviewed);
  const screenshot = website.screenshots[0];

  const isFirstScreen = index < 6;

  return (
    <ScrollReveal
      as="article"
      eager={isFirstScreen}
      delay={isFirstScreen ? 360 + index * 70 : Math.min(Math.max(index - 6, 0), 8) * 60}
      className="surface-interactive group flex h-full flex-col overflow-hidden rounded-xl"
    >
      <ToolDetailLink
        slug={website.slug}
        trackNewsletterIntent={trackNewsletterIntent}
        className="relative block overflow-hidden"
      >
        {screenshot ? (
          <div className="relative aspect-[16/10] w-full bg-dark-surface">
            <Image
              src={screenshot}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
          </div>
        ) : (
          <div className="aspect-[16/10] w-full bg-dark-surface" />
        )}
      </ToolDetailLink>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <ToolLogo name={website.name} logoUrl={website.logoUrl} size="sm" />
            <div className="min-w-0">
              <ToolDetailLink
                slug={website.slug}
                trackNewsletterIntent={trackNewsletterIntent}
                className="block truncate"
              >
                <h3 className="truncate text-[15px] font-medium tracking-[-0.02em] text-white transition-colors group-hover:text-neon">
                  {website.name}
                </h3>
              </ToolDetailLink>
              <p className="truncate text-[12px] text-muted-dim">{domain}</p>
            </div>
          </div>

          {website.rating && (
            <span className="flex shrink-0 items-center gap-1 text-[13px] tabular-nums text-white">
              <svg
                className="h-3.5 w-3.5 text-neon"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {website.rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="line-clamp-2 flex-1 text-[13px] leading-relaxed text-muted">
          {website.description}
        </p>

        <div className="mt-4 flex flex-col gap-3 border-t border-dark-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 truncate text-[12px] text-muted-dim">
            <span>{getCategoryLabel(website.category)}</span>
            {pricingHint && (
              <>
                <span className="text-white/20">·</span>
                <span>{pricingHint}</span>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {reviewed && (
              <span className="hidden text-[11px] text-muted-dim sm:inline">
                {reviewed}
              </span>
            )}
            <a
              href={`/go/${website.slug}`}
              className="inline-flex min-h-11 items-center gap-1 px-2 text-[12px] font-medium text-muted transition-colors hover:text-neon"
              title={`Visit ${website.name}`}
            >
              Visit
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}

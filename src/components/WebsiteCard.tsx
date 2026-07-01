import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ToolLogo } from "@/components/tool-detail/ToolLogo";
import { formatReviewed, getPricingHint } from "@/lib/homepage";
import { getCategoryLabel, getDomain } from "@/lib/websites";
import { Website } from "@/types";

interface WebsiteCardProps {
  website: Website;
  index?: number;
}

export function WebsiteCard({ website, index = 0 }: WebsiteCardProps) {
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
      <Link href={`/tools/${website.slug}`} className="relative block overflow-hidden">
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
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <ToolLogo name={website.name} logoUrl={website.logoUrl} size="sm" />
            <div className="min-w-0">
              <Link href={`/tools/${website.slug}`} className="block truncate">
                <h3 className="truncate text-[15px] font-medium tracking-[-0.02em] text-white transition-colors group-hover:text-neon">
                  {website.name}
                </h3>
              </Link>
              <p className="truncate text-[12px] text-muted-dim">{domain}</p>
            </div>
          </div>

          {website.rating && (
            <span className="shrink-0 text-[13px] tabular-nums text-white">
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

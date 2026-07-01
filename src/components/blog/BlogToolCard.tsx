import Image from "next/image";
import Link from "next/link";
import { getCategoryLabel } from "@/lib/websites";
import { Website } from "@/types";

export function BlogToolCard({ tool }: { tool: Website }) {
  const image = tool.screenshots[0];
  const topPro = tool.pros[0];
  const price = tool.pricing[0];

  return (
    <aside className="surface my-8 overflow-hidden rounded-xl border border-dark-border">
      <div className="grid sm:grid-cols-[200px_1fr]">
        {image && (
          <Link
            href={`/tools/${tool.slug}`}
            className="relative block aspect-[16/10] bg-dark-surface sm:aspect-auto sm:min-h-[140px]"
          >
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="200px"
              unoptimized
            />
          </Link>
        )}

        <div className="flex flex-col justify-center p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-muted-dim">
            <span className="rounded-full border border-dark-border px-2 py-0.5 text-muted">
              {getCategoryLabel(tool.category)}
            </span>
            {tool.rating && (
              <span className="text-neon">{tool.rating.toFixed(1)} / 5</span>
            )}
            {tool.lastReviewed && <span>Reviewed {tool.lastReviewed}</span>}
          </div>

          <Link href={`/tools/${tool.slug}`}>
            <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-white transition-colors hover:text-neon">
              {tool.name}
            </h3>
          </Link>

          <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted">
            {tool.description}
          </p>

          {(topPro || price) && (
            <dl className="mt-4 grid gap-2 text-[13px] sm:grid-cols-2">
              {topPro && (
                <div>
                  <dt className="text-muted-dim">Standout</dt>
                  <dd className="mt-0.5 text-muted">{topPro}</dd>
                </div>
              )}
              {price && (
                <div>
                  <dt className="text-muted-dim">Starting at</dt>
                  <dd className="mt-0.5 text-muted">
                    {price.price}
                    {price.note ? ` — ${price.note}` : ""}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <Link
            href={`/tools/${tool.slug}`}
            className="mt-5 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-white transition-colors hover:text-neon"
          >
            Read our full {tool.name} review →
          </Link>
        </div>
      </div>
    </aside>
  );
}

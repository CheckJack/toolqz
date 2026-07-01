import { ScrollReveal } from "@/components/motion/ScrollReveal";

interface BlogArticleHeaderProps {
  title: string;
  excerpt: string;
  date: string | null;
  authorName?: string | null;
}

export function BlogArticleHeader({
  title,
  excerpt,
  date,
  authorName,
}: BlogArticleHeaderProps) {
  return (
    <ScrollReveal
      as="header"
      eager
      className="mx-auto max-w-3xl border-b border-dark-border pb-8 text-center sm:pb-10"
    >
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-muted-dim">
        <span className="rounded-full border border-dark-border px-2.5 py-0.5 text-muted">
          Digital tools
        </span>
        {date && <time>{date}</time>}
        {authorName && (
          <>
            <span aria-hidden>·</span>
            <span>By {authorName}</span>
          </>
        )}
      </div>

      <h1 className="mt-5 break-words text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[2.75rem]">
        {title}
      </h1>

      <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-muted sm:text-[18px]">
        {excerpt}
      </p>
    </ScrollReveal>
  );
}

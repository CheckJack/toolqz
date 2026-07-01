import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { formatBlogDate } from "@/lib/blog";
import { BlogPostListItem } from "@/types/blog";

export function BlogFeaturedStory({ post }: { post: BlogPostListItem }) {
  const date = formatBlogDate(post.publishedAt);

  return (
    <ScrollReveal as="article" variant="fade-up" className="group grid gap-6 border-b border-dark-border pb-10 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:pb-12">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/10] overflow-hidden rounded-lg bg-dark-surface lg:aspect-auto lg:min-h-[320px]"
      >
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
            unoptimized
          />
        ) : (
          <div className="flex h-full min-h-[220px] flex-col justify-end bg-gradient-to-br from-dark-elevated via-dark-surface to-brand/40 p-6 lg:min-h-[320px]">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-neon">
              Featured
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-dim">
          <span className="rounded-full border border-dark-border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted">
            Digital tools
          </span>
          {date && <span>{date}</span>}
          {post.authorName && (
            <>
              <span aria-hidden>·</span>
              <span>{post.authorName}</span>
            </>
          )}
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h2 className="mt-4 break-words text-[1.5rem] font-semibold leading-[1.1] tracking-[-0.03em] text-white transition-colors group-hover:text-neon sm:text-[1.75rem] lg:text-[2.125rem]">
            {post.title}
          </h2>
        </Link>

        <p className="mt-4 text-[16px] leading-relaxed text-muted sm:text-[17px]">
          {post.excerpt}
        </p>

        <Link
          href={`/blog/${post.slug}`}
          className="mt-6 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-white transition-colors hover:text-neon"
        >
          Read full story
          <span aria-hidden>→</span>
        </Link>
      </div>
    </ScrollReveal>
  );
}

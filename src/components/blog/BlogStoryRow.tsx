import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { formatBlogDate } from "@/lib/blog";
import { BlogPostListItem } from "@/types/blog";

export function BlogStoryRow({ post, index = 0 }: { post: BlogPostListItem; index?: number }) {
  const date = formatBlogDate(post.publishedAt);

  return (
    <ScrollReveal
      as="article"
      delay={index * 70}
      variant="slide-right"
      className="group grid gap-4 border-b border-dark-border py-6 last:border-b-0 sm:grid-cols-[140px_1fr] sm:gap-6"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/10] overflow-hidden rounded-md bg-dark-surface sm:aspect-square"
      >
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="140px"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-dark-elevated to-dark-surface" />
        )}
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-muted-dim">
          <span className="text-muted">Apps &amp; web</span>
          {date && (
            <>
              <span aria-hidden>·</span>
              <time>{date}</time>
            </>
          )}
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h3 className="mt-2 text-[17px] font-medium leading-snug tracking-[-0.02em] text-white transition-colors group-hover:text-neon sm:text-[18px]">
            {post.title}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted">
          {post.excerpt}
        </p>
      </div>
    </ScrollReveal>
  );
}

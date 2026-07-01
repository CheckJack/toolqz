import Image from "next/image";
import Link from "next/link";
import { formatBlogDate } from "@/lib/blog";
import { BlogPostListItem } from "@/types/blog";

export function BlogCard({ post }: { post: BlogPostListItem }) {
  const date = formatBlogDate(post.publishedAt);

  return (
    <article className="surface-interactive group flex flex-col overflow-hidden rounded-xl">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-dark-surface">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-muted-dim">
            TOOLQZ Blog
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {date && (
          <p className="mb-2 text-[12px] text-muted-dim">
            {date}
            {post.authorName && ` · ${post.authorName}`}
          </p>
        )}
        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-[16px] font-medium tracking-[-0.02em] text-white transition-colors group-hover:text-neon">
            {post.title}
          </h2>
        </Link>
        <p className="mt-2 line-clamp-3 flex-1 text-[14px] leading-relaxed text-muted">
          {post.excerpt}
        </p>
        <Link
          href={`/blog/${post.slug}`}
          className="mt-4 text-[13px] font-medium text-muted transition-colors hover:text-white"
        >
          Read article →
        </Link>
      </div>
    </article>
  );
}

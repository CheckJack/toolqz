import Link from "next/link";
import { formatBlogDate } from "@/lib/blog";
import { BlogPostListItem } from "@/types/blog";

export function BlogHeadlines({
  posts,
  activeSlug,
}: {
  posts: BlogPostListItem[];
  activeSlug?: string;
}) {
  if (posts.length === 0) return null;

  return (
    <aside>
      <h2 className="border-b border-dark-border pb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
        Headlines
      </h2>
      <ol className="divide-y divide-dark-border">
        {posts.map((post, index) => {
          const isActive = post.slug === activeSlug;
          const date = formatBlogDate(post.publishedAt);

          return (
            <li key={post.id} className="py-3.5">
              <Link
                href={`/blog/${post.slug}`}
                className={`group flex gap-3 ${isActive ? "text-neon" : "text-white"}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="mt-0.5 w-5 shrink-0 text-[12px] font-medium tabular-nums text-muted-dim">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium leading-snug transition-colors group-hover:text-neon">
                    {post.title}
                  </span>
                  {date && (
                    <span className="mt-1 block text-[11px] text-muted-dim">{date}</span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

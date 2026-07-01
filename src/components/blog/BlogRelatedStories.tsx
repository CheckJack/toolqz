import { BlogStoryRow } from "@/components/blog/BlogStoryRow";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { BlogPostListItem } from "@/types/blog";

export function BlogRelatedStories({ posts }: { posts: BlogPostListItem[] }) {
  if (posts.length === 0) return null;

  return (
    <ScrollReveal as="section" className="mt-14 border-t border-dark-border pt-10">
      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
        More from TOOLQZ
      </h2>
      <div>
        {posts.map((post, index) => (
          <BlogStoryRow key={post.id} post={post} index={index} />
        ))}
      </div>
    </ScrollReveal>
  );
}

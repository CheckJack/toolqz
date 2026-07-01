import { prisma } from "@/lib/db";
import { serializeBlogListItem, serializeBlogPost } from "@/lib/blog-payload";

const authorSelect = { author: { select: { name: true } } } as const;

export async function getPublishedBlogPosts() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    include: authorSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  return posts.map(serializeBlogListItem);
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    include: authorSelect,
  });
  return post ? serializeBlogPost(post) : null;
}

export async function getAllBlogSlugs() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return posts.map((p) => p.slug);
}

export async function getPublishedBlogPostsExcept(slug: string, limit = 4) {
  const posts = await prisma.blogPost.findMany({
    where: { published: true, slug: { not: slug } },
    include: authorSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return posts.map(serializeBlogListItem);
}

export function formatBlogDate(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

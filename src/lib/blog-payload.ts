import type { BlogPost, User } from "@prisma/client";

type BlogPostWithAuthor = BlogPost & {
  author?: Pick<User, "name"> | null;
};

export function slugifyBlogTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function serializeBlogPost(post: BlogPostWithAuthor) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    published: post.published,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    authorName: post.author?.name ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function serializeBlogListItem(post: BlogPostWithAuthor) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    published: post.published,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    authorName: post.author?.name ?? null,
  };
}

export function buildBlogData(body: {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  published?: boolean;
  publishedAt?: string | null;
  authorId?: string | null;
  existingPublishedAt?: Date | null;
}) {
  const published = body.published ?? false;
  let publishedAt: Date | null = body.existingPublishedAt ?? null;

  if (published) {
    if (body.publishedAt) {
      publishedAt = new Date(body.publishedAt);
    } else if (!publishedAt) {
      publishedAt = new Date();
    }
  } else {
    publishedAt = null;
  }

  return {
    title: body.title.trim(),
    slug: (body.slug?.trim() || slugifyBlogTitle(body.title)).toLowerCase(),
    excerpt: body.excerpt.trim(),
    content: body.content.trim(),
    coverImage: body.coverImage?.trim() || null,
    published,
    publishedAt,
    authorId: body.authorId ?? null,
  };
}

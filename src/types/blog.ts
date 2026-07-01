export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  published: boolean;
  publishedAt?: string | null;
  authorName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  published: boolean;
  publishedAt?: string | null;
  authorName?: string | null;
}

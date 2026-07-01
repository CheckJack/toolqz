import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSense } from "@/components/AdSense";
import { BlogArticleHeader } from "@/components/blog/BlogArticleHeader";
import { BlogGuideToc } from "@/components/blog/BlogGuideToc";
import { BlogHeadlines } from "@/components/blog/BlogHeadlines";
import { BlogMarkdown } from "@/components/BlogMarkdown";
import { BlogTableOfContents } from "@/components/blog/BlogTableOfContents";
import {
  ProductivityApps2026Guide,
  productivityAppsFaqJsonLd,
} from "@/components/blog/ProductivityApps2026Guide";
import { BlogRelatedStories } from "@/components/blog/BlogRelatedStories";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ADSENSE_SLOTS } from "@/lib/adsense";
import {
  formatBlogDate,
  getAllBlogSlugs,
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
  getPublishedBlogPostsExcept,
} from "@/lib/blog";
import { productivityApps2026Excerpt } from "@/data/blog-guides/productivity-apps-2026";
import { contentHasToc, extractHeadings } from "@/lib/blog-markdown";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

function articleJsonLd(post: {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt?: string | null;
  coverImage?: string | null;
  authorName?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt ?? undefined,
    author: post.authorName
      ? { "@type": "Person", name: post.authorName }
      : { "@type": "Organization", name: "TOOLQZ" },
    publisher: {
      "@type": "Organization",
      name: "TOOLQZ",
    },
    image: post.coverImage ?? undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://toolqz.com/blog/${post.slug}`,
    },
  };
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllBlogSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return { title: "Post not found — TOOLQZ Blog" };
  }

  const description =
    slug === "five-productivity-apps-worth-your-time"
      ? productivityApps2026Excerpt
      : post.excerpt;

  return {
    title: `${post.title} — TOOLQZ Blog`,
    description,
    keywords: slug === "five-productivity-apps-worth-your-time"
      ? [
          "productivity apps 2026",
          "best productivity apps",
          "Notion review",
          "Todoist review",
          "Figma review",
          "Canva review",
          "Headspace review",
          "TOOLQZ",
        ]
      : undefined,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [post, related, allPosts] = await Promise.all([
    getPublishedBlogPostBySlug(slug),
    getPublishedBlogPostsExcept(slug, 3),
    getPublishedBlogPosts(),
  ]);

  if (!post) {
    notFound();
  }

  const date = formatBlogDate(post.publishedAt);
  const isProductivityGuide = slug === "five-productivity-apps-worth-your-time";
  const showGuideToc = isProductivityGuide;
  const showArticleToc = !isProductivityGuide && contentHasToc(post.content);
  const articleHeadings = showArticleToc ? extractHeadings(post.content) : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(post)) }}
      />
      {isProductivityGuide && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productivityAppsFaqJsonLd()) }}
        />
      )}
      <Header />
      <main className="page-bottom-padding px-5 pt-10 sm:px-8 sm:pt-14">
        <article className="mx-auto max-w-6xl">
          <nav className="mb-8 flex flex-wrap gap-x-2 gap-y-1 text-[13px] text-muted-dim">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="transition-colors hover:text-white">
              Blog
            </Link>
            <span className="mx-2">/</span>
            <span className="text-muted">Story</span>
          </nav>

          <BlogArticleHeader
            title={post.title}
            excerpt={post.excerpt}
            date={date}
            authorName={post.authorName}
          />

          {post.coverImage && (
            <ScrollReveal delay={120} className="relative mx-auto mt-8 aspect-[16/9] max-w-4xl overflow-hidden rounded-lg bg-dark-surface sm:mt-10">
              <Image
                src={post.coverImage}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
                priority
                unoptimized
              />
            </ScrollReveal>
          )}

          <AdSense
            slot={ADSENSE_SLOTS.blogArticleTop}
            format="horizontal"
            className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-lg sm:mt-10"
            minHeight={100}
          />

          <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
            <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none">
              {(showGuideToc || showArticleToc) && (
                <div className="mb-8 lg:hidden">
                  {showGuideToc ? (
                    <BlogGuideToc />
                  ) : (
                    <BlogTableOfContents headings={articleHeadings} />
                  )}
                </div>
              )}

              {isProductivityGuide ? (
                <ProductivityApps2026Guide />
              ) : (
                <BlogMarkdown content={post.content} />
              )}

              <div className="mt-10 border-t border-dark-border pt-6">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-white"
                >
                  ← Back to the blog
                </Link>
              </div>

              <BlogRelatedStories posts={related} />
            </div>

            <aside className="space-y-8 lg:sticky lg:top-[calc(var(--header-height)+env(safe-area-inset-top,0px)+1rem)] lg:self-start">
              {showGuideToc && (
                <div className="hidden lg:block">
                  <BlogGuideToc />
                </div>
              )}
              {showArticleToc && articleHeadings.length >= 3 && (
                <div className="hidden lg:block">
                  <BlogTableOfContents headings={articleHeadings} />
                </div>
              )}
              <AdSense
                slot={ADSENSE_SLOTS.blogArticleSidebar}
                format="rectangle"
                className="overflow-hidden rounded-lg"
                minHeight={250}
              />
              <BlogHeadlines posts={allPosts} activeSlug={slug} />
            </aside>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

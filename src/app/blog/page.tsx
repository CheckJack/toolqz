import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AdSense } from "@/components/AdSense";
import { BlogFeaturedStory } from "@/components/blog/BlogFeaturedStory";
import { BlogHeadlines } from "@/components/blog/BlogHeadlines";
import { BlogMasthead } from "@/components/blog/BlogMasthead";
import { BlogStoryRow } from "@/components/blog/BlogStoryRow";
import { ADSENSE_SLOTS } from "@/lib/adsense";
import { getPublishedBlogPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — TOOLQZ",
  description:
    "News and analysis on websites, apps, and digital tools — reviews, comparisons, and tips from the TOOLQZ team.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      <Header />
      <main className="page-bottom-padding px-5 pt-10 sm:px-8 sm:pt-14">
        <div className="mx-auto max-w-6xl">
          <BlogMasthead />

          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-dark-border px-6 py-16 text-center">
              <p className="text-[15px] font-medium text-white">No stories yet</p>
              <p className="mt-2 text-[14px] text-muted">
                Check back soon for coverage on apps, websites, and digital tools.
              </p>
            </div>
          ) : (
            <>
              {featured && <BlogFeaturedStory post={featured} />}

              <AdSense
                slot={ADSENSE_SLOTS.blogListBanner}
                format="horizontal"
                className="my-8 overflow-hidden rounded-lg"
                minHeight={100}
              />

              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
                <section>
                  <div className="mb-4 flex items-end justify-between border-b border-dark-border pb-3">
                    <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
                      Latest stories
                    </h2>
                    <span className="text-[12px] text-muted-dim">
                      {posts.length} {posts.length === 1 ? "article" : "articles"}
                    </span>
                  </div>

                  {rest.length > 0 ? (
                    <div>
                      {rest.map((post, index) => (
                        <BlogStoryRow key={post.id} post={post} index={index} />
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-[14px] text-muted">
                      More coverage coming soon. Start with the featured story above.
                    </p>
                  )}
                </section>

                <aside className="space-y-8 lg:sticky lg:top-[calc(var(--header-height)+env(safe-area-inset-top,0px)+1rem)] lg:self-start">
                  <AdSense
                    slot={ADSENSE_SLOTS.blogListSidebar}
                    format="rectangle"
                    className="overflow-hidden rounded-lg"
                    minHeight={250}
                  />
                  <BlogHeadlines posts={posts} />
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

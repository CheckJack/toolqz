"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Pencil, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";
import { formatBlogDate } from "@/lib/blog";
import type { BlogPostListItem } from "@/types/blog";

const PAGE_SIZE = 25;

type PublishTab = "" | "published" | "draft";

const PUBLISH_TABS: { value: PublishTab; label: string }[] = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
];

function publishedParam(tab: PublishTab): string {
  if (tab === "published") return "true";
  if (tab === "draft") return "false";
  return "";
}

function tabFromParam(value: string | null): PublishTab {
  if (value === "true") return "published";
  if (value === "false") return "draft";
  return "";
}

export function AdminBlog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState({ all: 0, published: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [publishedFilter, setPublishedFilter] = useState<PublishTab>(
    tabFromParam(searchParams.get("published"))
  );
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setSearchInput(searchParams.get("search") ?? "");
    setSearch(searchParams.get("search") ?? "");
    setPublishedFilter(tabFromParam(searchParams.get("published")));
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        syncParams({ search: searchInput, page: "" });
        setSearch(searchInput);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  function syncParams(updates: Partial<Record<string, string>>) {
    const params = new URLSearchParams(searchParams.toString());
    const merged = {
      search,
      published: publishedParam(publishedFilter),
      page: String(page),
      ...updates,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    router.replace(`/admin/blog?${params.toString()}`, { scroll: false });
  }

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(PAGE_SIZE));
    try {
      const res = await fetch(`/api/admin/blog?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPosts(data.items ?? []);
      setTotal(data.total ?? 0);
      setTabCounts(data.counts ?? { all: data.total ?? 0, published: 0, draft: 0 });
    } catch {
      setLoadError("Could not load blog posts");
      toast("Could not load blog posts", "error");
    } finally {
      setLoading(false);
    }
  }, [searchParams, toast]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Could not delete post", "error");
      return;
    }
    toast("Post deleted", "success");
    loadPosts();
  }

  function setPublishTab(value: PublishTab) {
    setPublishedFilter(value);
    syncParams({ published: publishedParam(value), page: "" });
  }

  function tabCount(value: PublishTab): number {
    if (value === "published") return tabCounts.published;
    if (value === "draft") return tabCounts.draft;
    return tabCounts.all;
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setPublishedFilter("");
    router.replace("/admin/blog", { scroll: false });
  }

  const listLabel =
    publishedFilter === "published"
      ? "published"
      : publishedFilter === "draft"
        ? "draft"
        : "";

  if (loading && posts.length === 0) return <AdminSkeleton rows={6} />;

  if (loadError && posts.length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {loadError}
        <button onClick={loadPosts} className="mt-2 block w-full text-sm text-neon">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Blog"
        description={`${tabCounts.all} ${listLabel ? `${listLabel} ` : ""}post${tabCounts.all === 1 ? "" : "s"}`}
        action={
          <Link href="/admin/blog/new" className="admin-btn-primary">
            New post
          </Link>
        }
      />

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-dark-border p-4 sm:p-5">
          <div className="admin-segmented w-fit max-w-full overflow-x-auto">
            {PUBLISH_TABS.map((tab) => {
              const active = publishedFilter === tab.value;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setPublishTab(tab.value)}
                  className={`admin-segmented-btn whitespace-nowrap ${active ? "admin-segmented-btn-active" : ""}`}
                >
                  {tab.label}
                  <span className="ml-1.5 tabular-nums opacity-70">{tabCount(tab.value)}</span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim"
              strokeWidth={1.75}
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts…"
              className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
            />
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-5">
            <p className="text-sm text-muted">
              {publishedFilter === "draft"
                ? "No draft posts match your filters."
                : publishedFilter === "published"
                  ? "No published posts match your filters."
                  : search
                    ? "No posts match your search."
                    : "No blog posts yet."}
            </p>
            {search || publishedFilter ? (
              <button type="button" onClick={clearFilters} className="admin-link-accent mt-3">
                Clear filters
              </button>
            ) : (
              <Link href="/admin/blog/new" className="admin-link-accent mt-3 inline-block">
                Write your first post
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[680px]">
                <thead>
                  <tr>
                    <th>Post</th>
                    <th className="hidden md:table-cell">Author</th>
                    <th className="hidden sm:table-cell">Published</th>
                    <th>Live</th>
                    <th className="w-12" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="min-w-[14rem]">
                        <div className="flex items-start gap-3">
                          {post.coverImage ? (
                            <img
                              src={post.coverImage}
                              alt=""
                              className="h-10 w-14 shrink-0 rounded-lg border border-dark-border bg-dark object-cover"
                            />
                          ) : null}
                          <div className="min-w-0">
                            <Link
                              href={`/admin/blog/${post.id}`}
                              className="block truncate font-medium text-white hover:text-neon"
                            >
                              {post.title}
                            </Link>
                            <p className="truncate font-mono text-[11px] text-muted-dim">
                              /blog/{post.slug}
                            </p>
                            {post.excerpt && (
                              <p className="mt-1 line-clamp-1 text-[11px] text-muted">
                                {post.excerpt}
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-muted sm:hidden">
                              {formatBlogDate(post.publishedAt) ?? "Not published"}
                              {post.authorName ? ` · ${post.authorName}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden text-muted md:table-cell">
                        {post.authorName ?? "—"}
                      </td>
                      <td className="hidden text-muted sm:table-cell">
                        {formatBlogDate(post.publishedAt) ?? "—"}
                      </td>
                      <td>
                        <span
                          className={`admin-toggle ${post.published ? "admin-toggle-on-emerald" : ""}`}
                        >
                          {post.published ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="w-12 text-right">
                        <BlogRowActions
                          post={post}
                          onDelete={() => void handleDelete(post.id, post.title)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-border px-4 py-3 text-sm text-muted sm:px-5">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => syncParams({ page: String(page - 1) })}
                    className="admin-toolbar-btn disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => syncParams({ page: String(page + 1) })}
                    className="admin-toolbar-btn disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BlogRowActions({
  post,
  onDelete,
}: {
  post: BlogPostListItem;
  onDelete: () => void;
}) {
  return (
    <AdminRowActionsMenu label={`Actions for ${post.title}`}>
      {(close) => (
        <>
          <Link
            href={`/admin/blog/${post.id}`}
            role="menuitem"
            onClick={close}
            className="admin-menu-item"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Edit post
          </Link>
          {post.published && (
            <Link
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={close}
              className="admin-menu-item"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              View on site
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onDelete();
            }}
            className="admin-menu-item w-full text-left text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Delete
          </button>
        </>
      )}
    </AdminRowActionsMenu>
  );
}

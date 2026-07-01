"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";
import { formatBlogDate } from "@/lib/blog";
import type { BlogPostListItem } from "@/types/blog";

const PAGE_SIZE = 25;

export function AdminBlog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [publishedFilter, setPublishedFilter] = useState(
    searchParams.get("published") ?? ""
  );
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
      published: publishedFilter,
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
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(PAGE_SIZE));
    try {
      const res = await fetch(`/api/admin/blog?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPosts(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
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

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Blog</h1>
          <p className="mt-1 text-sm text-muted">
            Write and publish articles about websites, apps, and digital tools.
          </p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary">
          New post
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search posts…"
          className="surface w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted-dim focus:border-white/20 focus:outline-none sm:max-w-xs"
        />
        <select
          value={publishedFilter}
          onChange={(e) => {
            setPublishedFilter(e.target.value);
            syncParams({ published: e.target.value, page: "" });
          }}
          className="surface rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </div>

      {loading ? (
        <AdminSkeleton rows={5} />
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted">No blog posts found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-dark-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-dark-border bg-dark-elevated text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-dark-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{post.title}</p>
                    <p className="text-xs text-muted-dim">/blog/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs ${
                        post.published ? "text-neon" : "text-muted"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatBlogDate(post.publishedAt) ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-neon hover:underline"
                      >
                        Edit
                      </Link>
                      {post.published && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted hover:text-white"
                        >
                          View
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id, post.title)}
                        className="text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-sm text-muted">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => syncParams({ page: String(page - 1) })}
            className="disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => syncParams({ page: String(page + 1) })}
            className="disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

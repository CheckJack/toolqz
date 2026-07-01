"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";
import { SessionUser } from "@/lib/auth";
import type { AdminTool } from "@/lib/tool-payload";

const PAGE_SIZE = 25;

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-400",
  IN_PROGRESS: "text-blue-400",
  APPLIED: "text-purple-400",
  ACTIVE: "text-neon",
  REJECTED: "text-red-400",
  PAUSED: "text-muted",
  NOT_AVAILABLE: "text-orange-400",
  ON_HOLD: "text-amber-400",
};

type SortKey = "name" | "clicks" | "updated";

export function AdminTools({ user }: { user: SessionUser }) {
  const isAdmin = user.role === "ADMIN";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [publishedFilter, setPublishedFilter] = useState(
    searchParams.get("publishedFilter") ?? ""
  );
  const [affiliateFilter, setAffiliateFilter] = useState(
    searchParams.get("affiliateFilter") ?? ""
  );
  const [sort, setSort] = useState<SortKey>(
    (searchParams.get("sort") as SortKey) || "name"
  );
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setSearchInput(searchParams.get("search") ?? "");
    setSearch(searchParams.get("search") ?? "");
    setCategory(searchParams.get("category") ?? "");
    setPublishedFilter(searchParams.get("publishedFilter") ?? "");
    setAffiliateFilter(searchParams.get("affiliateFilter") ?? "");
    const s = searchParams.get("sort");
    if (s === "name" || s === "clicks" || s === "updated") setSort(s);
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
      category,
      publishedFilter,
      affiliateFilter,
      sort,
      page: String(page),
      ...updates,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    router.replace(`/admin/tools?${params.toString()}`, { scroll: false });
  }

  const loadTools = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(PAGE_SIZE));
    if (!params.has("sort")) params.set("sort", "name");

    try {
      const res = await fetch(`/api/admin/tools?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTools(data.items ?? []);
      setTotal(data.total ?? 0);
      setCategories(data.categories ?? []);
    } catch {
      setLoadError("Failed to load tools");
      toast("Failed to load tools", "error");
    } finally {
      setLoading(false);
    }
  }, [searchParams, toast]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  async function toggleField(
    id: string,
    field: "published" | "featured",
    value: boolean,
    options?: { silent?: boolean }
  ) {
    const previous = tools.find((t) => t.id === id)?.[field];
    const res = await fetch(`/api/admin/tools/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      setTools((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
      if (options?.silent) return;

      const label =
        field === "published"
          ? value
            ? "published"
            : "unpublished"
          : value
            ? "featured"
            : "unfeatured";

      if (!value && previous) {
        toast(`Tool ${label}`, "success", {
          action: {
            label: "Undo",
            onClick: () => toggleField(id, field, true, { silent: true }),
          },
        });
      } else {
        toast(`Tool ${label}`);
      }
    } else if (res.status === 403) {
      toast("Only admins can change publish or featured status", "error");
    } else {
      toast("Update failed", "error");
    }
  }

  function getWarningLink(tool: AdminTool): string {
    if (tool.affiliate?.status === "ACTIVE" && !tool.affiliateUrl) {
      return `/admin/affiliates/${tool.affiliate.id}`;
    }
    return `/admin/tools/${tool.id}`;
  }

  async function toggleFeatured(tool: AdminTool) {
    const next = !tool.featured;
    if (tool.featured && tool.published && !next) {
      if (!confirm(`Remove "${tool.name}" from featured? It will no longer appear in featured sections.`)) return;
    }
    await toggleField(tool.id, "featured", next);
  }

  async function togglePublished(tool: AdminTool) {
    const next = !tool.published;
    if (!next && tool.published) {
      if (!confirm(`Unpublish "${tool.name}"? It will be hidden from the public site.`)) return;
    }
    await toggleField(tool.id, "published", next);
  }

  function getWarning(tool: AdminTool): string | null {
    if (tool.affiliate?.status === "ACTIVE" && !tool.affiliateUrl)
      return "ACTIVE affiliate but no tracking URL";
    if (tool.published && !tool.affiliateUrl) return "Published without affiliate URL";
    return null;
  }

  if (loading) return <AdminSkeleton rows={8} />;

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {loadError}
        <button onClick={loadTools} className="mt-2 block w-full text-sm text-neon">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tools</h1>
          <p className="text-muted">
            {total} tool{total === 1 ? "" : "s"}
            {total !== tools.length ? ` · showing ${tools.length} on this page` : ""}
          </p>
        </div>
        <Link
          href="/admin/tools/new"
          className="inline-flex rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-ink hover:bg-neon-dim"
        >
          + Add tool
        </Link>
      </div>

      <div className="grid gap-3 rounded-2xl border border-dark-border bg-dark-elevated p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search tools..."
          className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/50 focus:outline-none sm:col-span-2"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            syncParams({ category: e.target.value, page: "" });
          }}
          className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={publishedFilter}
          onChange={(e) => {
            setPublishedFilter(e.target.value);
            syncParams({ publishedFilter: e.target.value, page: "" });
          }}
          className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft / hidden</option>
        </select>
        <select
          value={affiliateFilter}
          onChange={(e) => {
            setAffiliateFilter(e.target.value);
            syncParams({ affiliateFilter: e.target.value, page: "" });
          }}
          className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white"
        >
          <option value="">All affiliate states</option>
          <option value="has">Has tracking URL</option>
          <option value="missing">Published, no URL</option>
          <option value="crm-active-no-url">ACTIVE CRM, no URL</option>
        </select>
        <select
          value={sort}
          onChange={(e) => {
            const v = e.target.value as SortKey;
            setSort(v);
            syncParams({ sort: v, page: "" });
          }}
          className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white lg:col-span-1"
        >
          <option value="name">Sort: name</option>
          <option value="clicks">Sort: clicks</option>
          <option value="updated">Sort: last updated</option>
        </select>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-12 text-center">
          <p className="text-muted">No tools match your filters.</p>
          <button
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setCategory("");
              setPublishedFilter("");
              setAffiliateFilter("");
              router.replace("/admin/tools", { scroll: false });
            }}
            className="mt-3 text-sm text-neon hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-left text-muted">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Clicks</th>
                    <th className="px-4 py-3 font-medium">Featured</th>
                    <th className="px-4 py-3 font-medium">Published</th>
                    <th className="px-4 py-3 font-medium">Affiliate</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((tool) => {
                    const warning = getWarning(tool);
                    return (
                      <tr
                        key={tool.id}
                        className="border-b border-dark-border/50 last:border-0 hover:bg-dark/50"
                      >
                        <td className="px-4 py-3">
                          <Link href={`/admin/tools/${tool.id}`} className="block font-medium hover:text-neon">
                            {tool.name}
                          </Link>
                          <div className="text-xs text-muted">/tools/{tool.slug}</div>
                          {warning && (
                            <Link
                              href={getWarningLink(tool)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400 hover:bg-amber-500/20"
                            >
                              {warning} →
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize text-muted">{tool.category}</td>
                        <td className="px-4 py-3 font-semibold text-neon">{tool._count?.clicks ?? 0}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {isAdmin ? (
                            <button
                              onClick={() => toggleFeatured(tool)}
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                tool.featured ? "bg-neon/10 text-neon" : "border border-dark-border text-muted"
                              }`}
                            >
                              {tool.featured ? "Yes" : "No"}
                            </button>
                          ) : (
                            <span className={`text-xs ${tool.featured ? "text-neon" : "text-muted"}`}>
                              {tool.featured ? "Yes" : "No"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {isAdmin ? (
                            <button
                              onClick={() => togglePublished(tool)}
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                tool.published ? "bg-neon/10 text-neon" : "border border-dark-border text-muted"
                              }`}
                            >
                              {tool.published ? "Live" : "Hidden"}
                            </button>
                          ) : (
                            <span className={`text-xs ${tool.published ? "text-neon" : "text-muted"}`}>
                              {tool.published ? "Live" : "Hidden"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {tool.affiliate ? (
                            <Link
                              href={`/admin/affiliates/${tool.affiliate.id}`}
                              className={`text-xs font-medium hover:underline ${statusColors[tool.affiliate.status] ?? "text-neon"}`}
                            >
                              {tool.affiliate.status.replace(/_/g, " ")}
                            </Link>
                          ) : (
                            <Link
                              href={`/admin/affiliates?action=create&companyName=${encodeURIComponent(tool.name)}&toolId=${tool.id}&website=${encodeURIComponent(tool.url)}`}
                              className="text-xs text-muted hover:text-neon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Create in CRM →
                            </Link>
                          )}
                          {tool.affiliateUrl && (
                            <span className="ml-2 text-xs text-neon">· Tracking</span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/tools/${tool.id}`}
                              className="text-xs text-neon hover:underline"
                            >
                              Edit
                            </Link>
                            {tool.published && (
                              <Link
                                href={`/tools/${tool.slug}`}
                                target="_blank"
                                className="text-xs text-muted hover:text-white"
                              >
                                Preview
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted">
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page <= 1}
                onClick={() => syncParams({ page: String(page - 1) })}
                className="rounded-lg border border-dark-border px-3 py-1 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => syncParams({ page: String(page + 1) })}
                className="rounded-lg border border-dark-border px-3 py-1 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

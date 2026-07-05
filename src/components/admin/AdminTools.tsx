"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Pencil, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";
import { SessionUser } from "@/lib/auth";
import type { AdminTool } from "@/lib/tool-payload";
import { getCategoryLabel } from "@/lib/websites";
import { TOOL_LISTING_LABELS } from "@/constants/tool-listing";

const PAGE_SIZE = 25;

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-400",
  IN_PROGRESS: "text-blue-400",
  APPLIED: "text-purple-400",
  ACTIVE: "text-emerald-400",
  REJECTED: "text-red-400",
  PAUSED: "text-muted",
  NOT_AVAILABLE: "text-orange-400",
  ON_HOLD: "text-amber-400",
};

type SortKey = "name" | "clicks" | "updated";
type PublishTab = "" | "published" | "draft";

const PUBLISH_TABS: { value: PublishTab; label: string }[] = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
];

export function AdminTools({ user }: { user: SessionUser }) {
  const isAdmin = user.role === "ADMIN";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [tools, setTools] = useState<AdminTool[]>([]);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState({ all: 0, published: 0, draft: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({});
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
      setTabCounts(data.counts ?? { all: data.total ?? 0, published: 0, draft: 0 });
      setCategories(data.categories ?? []);
      setCategoryLabels(data.categoryLabels ?? {});
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
      if (!confirm(`Remove "${tool.name}" from featured?`)) return;
    }
    await toggleField(tool.id, "featured", next);
  }

  async function togglePublished(tool: AdminTool) {
    const next = !tool.published;
    if (!next && tool.published) {
      if (!confirm(`Unpublish "${tool.name}"?`)) return;
    }
    await toggleField(tool.id, "published", next);
  }

  function getWarning(tool: AdminTool): string | null {
    const isPartner = tool.listingType === "AFFILIATE";
    if (isPartner && tool.affiliate?.status === "ACTIVE" && !tool.affiliateUrl)
      return "Active affiliate, no tracking URL";
    if (isPartner && tool.published && !tool.affiliateUrl)
      return "Partner listing without tracking URL";
    return null;
  }

  function setPublishTab(value: PublishTab) {
    setPublishedFilter(value);
    syncParams({ publishedFilter: value, page: "" });
  }

  function tabCount(value: PublishTab): number {
    if (value === "published") return tabCounts.published;
    if (value === "draft") return tabCounts.draft;
    return tabCounts.all;
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setAffiliateFilter("");
    router.replace("/admin/tools", { scroll: false });
  }

  const listLabel =
    publishedFilter === "published"
      ? "published"
      : publishedFilter === "draft"
        ? "draft"
        : "";

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
      <AdminPageHeader
        hideTitle
        title="Tools"
        description={`${total} ${listLabel ? `${listLabel} ` : ""}tool${total === 1 ? "" : "s"}`}
        action={
          <Link href="/admin/tools/new" className="admin-btn-primary">
            Add tool
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

          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim"
                strokeWidth={1.75}
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search tools…"
                className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  syncParams({ category: e.target.value, page: "" });
                }}
                className="min-w-[9rem] flex-1 rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white sm:flex-none"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {getCategoryLabel(c, categoryLabels)}
                  </option>
                ))}
              </select>
              <select
                value={affiliateFilter}
                onChange={(e) => {
                  setAffiliateFilter(e.target.value);
                  syncParams({ affiliateFilter: e.target.value, page: "" });
                }}
                className="min-w-[9rem] flex-1 rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white sm:flex-none"
              >
                <option value="">All affiliate states</option>
                <option value="has">Has tracking URL</option>
                <option value="missing">Published, no URL</option>
                <option value="crm-active-no-url">Active CRM, no URL</option>
              </select>
              <select
                value={sort}
                onChange={(e) => {
                  const v = e.target.value as SortKey;
                  setSort(v);
                  syncParams({ sort: v, page: "" });
                }}
                className="min-w-[9rem] flex-1 rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white sm:flex-none"
              >
                <option value="name">Name</option>
                <option value="clicks">Clicks</option>
                <option value="updated">Updated</option>
              </select>
            </div>
          </div>
        </div>

        {tools.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-5">
            <p className="text-sm text-muted">No tools match your filters.</p>
            {(search || category || affiliateFilter) && (
              <button type="button" onClick={clearFilters} className="admin-link-accent mt-3">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[720px]">
                <thead>
                  <tr>
                    <th>Tool</th>
                    <th className="hidden md:table-cell">Category</th>
                    <th className="text-right">Clicks</th>
                    <th>Live</th>
                    <th className="hidden sm:table-cell">Featured</th>
                    <th className="hidden lg:table-cell">Listing</th>
                    <th className="w-12" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {tools.map((tool) => {
                    const warning = getWarning(tool);
                    const clicks = tool._count?.clicks ?? 0;

                    return (
                      <tr key={tool.id}>
                        <td className="min-w-[12rem]">
                          <div className="flex items-center gap-3">
                            {tool.logoUrl && (
                              <img
                                src={tool.logoUrl}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-lg border border-dark-border bg-dark object-contain p-1"
                              />
                            )}
                            <div className="min-w-0">
                              <Link
                                href={`/admin/tools/${tool.id}`}
                                className="block truncate font-medium text-white hover:text-neon"
                              >
                                {tool.name}
                              </Link>
                              <p className="truncate font-mono text-[11px] text-muted-dim">
                                /{tool.slug}
                              </p>
                              <p className="truncate text-[11px] text-muted md:hidden">
                                {getCategoryLabel(tool.category, categoryLabels)}
                              </p>
                              {warning && (
                                <Link
                                  href={getWarningLink(tool)}
                                  className="mt-1 block text-[11px] text-amber-400 hover:underline"
                                >
                                  {warning}
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="hidden text-muted md:table-cell">
                          {getCategoryLabel(tool.category, categoryLabels)}
                        </td>
                        <td className="text-right font-medium tabular-nums text-white">
                          {clicks.toLocaleString()}
                        </td>
                        <td>
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => togglePublished(tool)}
                              className={`admin-toggle ${tool.published ? "admin-toggle-on-emerald" : ""}`}
                            >
                              {tool.published ? "Yes" : "No"}
                            </button>
                          ) : (
                            <span className={tool.published ? "text-emerald-400" : "text-muted"}>
                              {tool.published ? "Yes" : "No"}
                            </span>
                          )}
                        </td>
                        <td className="hidden sm:table-cell">
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => toggleFeatured(tool)}
                              className={`admin-toggle ${tool.featured ? "admin-toggle-on" : ""}`}
                            >
                              {tool.featured ? "Yes" : "No"}
                            </button>
                          ) : (
                            <span className={tool.featured ? "text-neon" : "text-muted"}>
                              {tool.featured ? "Yes" : "No"}
                            </span>
                          )}
                        </td>
                        <td className="hidden lg:table-cell">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                              tool.listingType === "AFFILIATE"
                                ? "bg-neon/10 text-neon"
                                : "bg-dark-border text-muted"
                            }`}
                          >
                            {TOOL_LISTING_LABELS[tool.listingType === "AFFILIATE" ? "AFFILIATE" : "EDITORIAL"]}
                          </span>
                          {tool.listingType === "AFFILIATE" && tool.affiliate ? (
                            <Link
                              href={`/admin/affiliates/${tool.affiliate.id}`}
                              className={`mt-1 block text-xs font-medium hover:underline ${statusColors[tool.affiliate.status] ?? "text-neon"}`}
                            >
                              CRM · {tool.affiliate.status.replace(/_/g, " ")}
                            </Link>
                          ) : tool.listingType === "AFFILIATE" ? (
                            <Link
                              href={`/admin/affiliates?action=create&companyName=${encodeURIComponent(tool.name)}&toolId=${tool.id}&website=${encodeURIComponent(tool.url)}`}
                              className="mt-1 block text-xs text-muted hover:text-white"
                            >
                              Add to CRM
                            </Link>
                          ) : null}
                          {tool.listingType === "AFFILIATE" && tool.affiliateUrl && (
                            <span className="mt-0.5 block text-[11px] text-muted-dim">Tracking set</span>
                          )}
                        </td>
                        <td className="w-12 text-right">
                          <ToolRowActions tool={tool} />
                        </td>
                      </tr>
                    );
                  })}
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

function ToolRowActions({ tool }: { tool: AdminTool }) {
  return (
    <AdminRowActionsMenu label={`Actions for ${tool.name}`}>
      {(close) => (
        <>
          <Link
            href={`/admin/tools/${tool.id}`}
            role="menuitem"
            onClick={close}
            className="admin-menu-item"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Edit tool
          </Link>
          {tool.published && (
            <Link
              href={`/tools/${tool.slug}`}
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
        </>
      )}
    </AdminRowActionsMenu>
  );
}

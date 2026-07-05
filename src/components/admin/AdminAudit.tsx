"use client";

import Link from "next/link";
import { ClipboardList, Download, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

interface AuditResponse {
  items: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts?: Record<string, number>;
}

type EntityTab =
  | ""
  | "tool"
  | "affiliate"
  | "user"
  | "finance"
  | "subscriber"
  | "category"
  | "blog_post";

const ENTITY_TABS: { value: EntityTab; label: string }[] = [
  { value: "", label: "All" },
  { value: "tool", label: "Tools" },
  { value: "affiliate", label: "Affiliates" },
  { value: "user", label: "Team" },
  { value: "finance", label: "Finances" },
  { value: "subscriber", label: "Subscribers" },
  { value: "category", label: "Categories" },
  { value: "blog_post", label: "Blog" },
];

const ACTION_FILTERS = [
  { value: "", label: "All actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "publish", label: "Publish" },
  { value: "unpublish", label: "Unpublish" },
  { value: "status_change", label: "Status change" },
  { value: "assign", label: "Assign" },
  { value: "role_change", label: "Role change" },
  { value: "import", label: "Import" },
  { value: "feature", label: "Feature" },
  { value: "unfeature", label: "Unfeature" },
  { value: "delete_redirect", label: "Remove redirect" },
  { value: "slug_redirect", label: "Slug redirect" },
] as const;

const PAGE_SIZE = 50;

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAction(action: string) {
  return action.replace(/_/g, " ");
}

function formatEntity(entity: string) {
  if (entity === "blog_post") return "Blog";
  if (entity === "user") return "Team";
  return entity.charAt(0).toUpperCase() + entity.slice(1);
}

function actionBadgeClass(action: string): string {
  if (action === "create") return "bg-emerald-500/10 text-emerald-400";
  if (action === "delete" || action === "delete_redirect") return "bg-red-400/10 text-red-400";
  if (action === "update" || action === "status_change" || action === "role_change" || action === "assign") {
    return "bg-sky-400/10 text-sky-400";
  }
  if (action === "publish" || action === "feature" || action === "slug_redirect") {
    return "bg-neon/10 text-neon";
  }
  if (action === "unpublish" || action === "unfeature") return "bg-amber-400/10 text-amber-400";
  if (action === "import") return "bg-purple-400/10 text-purple-400";
  return "bg-dark-border/80 text-muted";
}

function entityHref(entity: string, entityId: string | null): string | null {
  if (!entityId) return null;
  switch (entity) {
    case "tool":
      return `/admin/tools/${entityId}`;
    case "affiliate":
      return `/admin/affiliates/${entityId}`;
    case "blog_post":
      return `/admin/blog/${entityId}`;
    case "finance":
      return "/admin/finances";
    case "subscriber":
      return "/admin/subscribers";
    case "category":
      return "/admin/categories";
    case "user":
      return "/admin/team";
    default:
      return null;
  }
}

export function AdminAudit() {
  const { toast } = useToast();
  const [data, setData] = useState<AuditResponse | null>(null);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({ all: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState<EntityTab>("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput.trim() !== search) {
        setSearch(searchInput.trim());
        setPage(1);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, search]);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (search) params.set("search", search);
    if (action) params.set("action", action);
    if (entity) params.set("entity", entity);

    fetch(`/api/admin/audit?${params}`)
      .then(async (r) => {
        if (r.status === 403) throw new Error("Admin access required");
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((body: AuditResponse) => {
        setData(body);
        setTabCounts(body.counts ?? { all: body.total ?? 0 });
      })
      .catch((err) =>
        setLoadError(
          err instanceof Error && err.message === "Admin access required"
            ? "Audit log is only available to admin accounts."
            : "Could not load audit log."
        )
      )
      .finally(() => setLoading(false));
  }, [action, entity, page, search]);

  useEffect(() => {
    load();
  }, [load]);

  function onEntityChange(value: EntityTab) {
    setEntity(value);
    setPage(1);
  }

  function onActionChange(value: string) {
    setAction(value);
    setPage(1);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setAction("");
    setEntity("");
    setPage(1);
  }

  function tabCount(value: EntityTab): number {
    if (!value) return tabCounts.all ?? 0;
    return tabCounts[value] ?? 0;
  }

  async function exportCsv() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (action) params.set("action", action);
    if (entity) params.set("entity", entity);
    try {
      const res = await fetch(`/api/admin/audit/export?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `toolqz-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Audit log exported");
    } catch {
      toast("Export failed", "error");
    }
  }

  const logs = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const allTotal = tabCounts.all ?? total;

  const hasFilters = Boolean(search || action || entity);

  const description =
    allTotal > 0
      ? `${allTotal} event${allTotal === 1 ? "" : "s"} · tools, CRM, team, and imports`
      : "Creates, publishes, CRM changes, imports, and deletes";

  if (loading && !data) return <AdminSkeleton rows={8} />;

  if (loadError && !data) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {loadError}
        <button type="button" onClick={load} className="admin-link-accent mt-2">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Audit log"
        description={description}
        action={
          <button type="button" onClick={() => void exportCsv()} className="admin-toolbar-btn">
            <Download className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Export CSV
          </button>
        }
      />

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-dark-border p-4 sm:p-5">
          <div className="admin-segmented w-fit max-w-full overflow-x-auto">
            {ENTITY_TABS.map((tab) => {
              const active = entity === tab.value;
              return (
                <button
                  key={tab.value || "all"}
                  type="button"
                  onClick={() => onEntityChange(tab.value)}
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
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search detail, name, or email…"
                className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
              />
            </div>
            <select
              value={action}
              onChange={(e) => onActionChange(e.target.value)}
              className="min-w-[10rem] rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white lg:w-48"
            >
              {ACTION_FILTERS.map((f) => (
                <option key={f.value || "all"} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-4 sm:p-5">
            <AdminSkeleton rows={6} />
          </div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-5">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-dark-border bg-dark text-muted">
              <ClipboardList className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-muted">
              {hasFilters ? "No entries match your filters." : "No activity recorded yet."}
            </p>
            {!hasFilters ? (
              <p className="mx-auto mt-2 max-w-md text-[13px] text-muted-dim">
                Entries appear when your team creates or deletes tools, changes CRM status, imports
                programs, publishes content, or manages team members.
              </p>
            ) : (
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
                    <th>Event</th>
                    <th className="hidden sm:table-cell">Who</th>
                    <th className="text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const href = entityHref(log.entity, log.entityId);
                    return (
                      <tr key={log.id}>
                        <td className="min-w-[16rem]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${actionBadgeClass(log.action)}`}
                            >
                              {formatAction(log.action)}
                            </span>
                            <span className="rounded-md bg-dark-border/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                              {formatEntity(log.entity)}
                            </span>
                          </div>
                          <p className="mt-2 text-[13px] leading-relaxed text-white">
                            {log.detail ?? "—"}
                          </p>
                          {href && (
                            <Link href={href} className="admin-link-accent mt-1 inline-block text-[11px]">
                              View {formatEntity(log.entity).toLowerCase()}
                            </Link>
                          )}
                          <p className="mt-1 text-[11px] text-muted sm:hidden">
                            {log.user?.name ?? "System"} · {formatWhen(log.createdAt)}
                          </p>
                        </td>
                        <td className="hidden sm:table-cell">
                          <p className="font-medium text-white">{log.user?.name ?? "System"}</p>
                          {log.user?.email && (
                            <p className="mt-0.5 text-[11px] text-muted-dim">{log.user.email}</p>
                          )}
                        </td>
                        <td className="text-right text-muted whitespace-nowrap">
                          {formatWhen(log.createdAt)}
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
                  {hasFilters ? ` · ${total} shown` : ""}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => p - 1)}
                    className="admin-toolbar-btn disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
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

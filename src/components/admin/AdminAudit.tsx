"use client";

import { useCallback, useEffect, useState } from "react";
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
}

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

const ENTITY_FILTERS = [
  { value: "", label: "All entities" },
  { value: "tool", label: "Tools" },
  { value: "affiliate", label: "Affiliates" },
  { value: "user", label: "Users" },
  { value: "finance", label: "Finances" },
] as const;

const PAGE_SIZE = 50;

export function AdminAudit() {
  const { toast } = useToast();
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (action) params.set("action", action);
    if (entity) params.set("entity", entity);
    fetch(`/api/admin/audit?${params}`)
      .then(async (r) => {
        if (r.status === 403) throw new Error("Admin access required");
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error && err.message === "Admin access required"
          ? "Audit log is only available to admin accounts. Log in as admin@toolqz.com to view it."
          : "Failed to load audit log. If this started after a recent update, restart with npm run dev:clean.")
      )
      .finally(() => setLoading(false));
  }, [action, entity, page]);

  useEffect(() => {
    load();
  }, [load]);

  function onFilterChange(type: "action" | "entity", value: string) {
    setPage(1);
    if (type === "action") setAction(value);
    else setEntity(value);
  }

  async function exportCsv() {
    const params = new URLSearchParams();
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

  if (loading && !data) return <AdminSkeleton rows={8} />;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {error}
        <button onClick={load} className="mt-2 block w-full text-sm text-neon">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit log</h1>
        <p className="text-muted">
          {data?.total ?? 0} entries · creates, publishes, CRM changes, imports, and deletes
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={action}
          onChange={(e) => onFilterChange("action", e.target.value)}
          className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white"
        >
          {ACTION_FILTERS.map((f) => (
            <option key={f.value || "all"} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          value={entity}
          onChange={(e) => onFilterChange("entity", e.target.value)}
          className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white"
        >
          {ENTITY_FILTERS.map((f) => (
            <option key={f.value || "all"} value={f.value}>{f.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void exportCsv()}
          className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
        >
          Export CSV
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-12 text-center">
          <p className="text-muted">
            {action || entity
              ? "No entries match your filters."
              : "No activity recorded yet."}
          </p>
          {!action && !entity && (
            <p className="mt-3 text-sm text-muted">
              Entries appear when you or your team create or delete tools, change CRM status,
              import programs, publish tools, or manage team members.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-left text-muted">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Who</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Entity</th>
                    <th className="px-4 py-3 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-dark-border/50 last:border-0">
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{log.user?.name ?? "System"}</td>
                      <td className="px-4 py-3 capitalize text-neon">{log.action.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 capitalize text-muted">{log.entity}</td>
                      <td className="px-4 py-3 text-muted">{log.detail ?? "—"}</td>
                    </tr>
                  ))}
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
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-dark-border px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-dark-border px-3 py-1 disabled:opacity-40"
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

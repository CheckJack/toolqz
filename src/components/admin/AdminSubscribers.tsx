"use client";

import { Mail, Search, Trash2, Upload, UserMinus, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";
import { parseCsv } from "@/lib/csv-parse";
import { parseSubscriberImportRow } from "@/lib/subscribers";
import { NewsletterSubscriber, SubscriberImportRow } from "@/types/subscriber";

const PAGE_SIZE = 25;

type StatusTab = "ALL" | "ACTIVE" | "UNSUBSCRIBED";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "UNSUBSCRIBED", label: "Unsubscribed" },
];

const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none";

function parseImportCsv(text: string): SubscriberImportRow[] {
  const rows = parseCsv(text.trim());
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows
    .slice(1)
    .map((cols) => parseSubscriberImportRow(headers, cols))
    .filter((row): row is SubscriberImportRow => row !== null);
}

function formatSource(source: string) {
  if (source === "popup") return "Popup";
  if (source === "manual") return "Manual";
  if (source === "import") return "Import";
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export function AdminSubscribers() {
  const { toast } = useToast();
  const [items, setItems] = useState<NewsletterSubscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState({ all: 0, ACTIVE: 0, UNSUBSCRIBED: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusTab>("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput.trim() !== search) {
        setSearch(searchInput.trim());
        setPage(1);
        setSelected(new Set());
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
    if (status !== "ALL") params.set("status", status);

    fetch(`/api/admin/subscribers?${params}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setTabCounts(
          data.counts ?? {
            all: data.total ?? 0,
            ACTIVE: data.activeCount ?? 0,
            UNSUBSCRIBED: 0,
          }
        );
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => {
        setLoadError("Could not load mailing list");
        toast("Failed to load mailing list", "error");
      })
      .finally(() => setLoading(false));
  }, [page, search, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [status]);

  const importPreview = useMemo(() => parseImportCsv(importText).slice(0, 5), [importText]);
  const importTotal = useMemo(() => parseImportCsv(importText).length, [importText]);

  function tabCount(value: StatusTab): number {
    if (value === "ACTIVE") return tabCounts.ACTIVE;
    if (value === "UNSUBSCRIBED") return tabCounts.UNSUBSCRIBED;
    return tabCounts.all;
  }

  function onStatusChange(value: StatusTab) {
    setStatus(value);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("ALL");
    setPage(1);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((s) => s.id)));
    }
  }

  async function exportCsv(ids?: string[]) {
    const params = new URLSearchParams();
    if (ids?.length) {
      params.set("ids", ids.join(","));
    } else {
      if (search) params.set("search", search);
      if (status !== "ALL") params.set("status", status);
    }

    try {
      const res = await fetch(`/api/admin/subscribers/export?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `toolqz-mailing-list-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Mailing list exported");
    } catch {
      toast("Export failed", "error");
    }
  }

  async function handleImport() {
    const rows = parseImportCsv(importText);
    if (!rows.length) {
      toast("No valid rows found", "error");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/admin/subscribers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(
          `Created ${data.created}, updated ${data.updated}, skipped ${data.skipped}${data.errors?.length ? ` (${data.errors.length} errors)` : ""}`
        );
        toast("Import complete");
        load();
      } else {
        toast(data.error ?? "Import failed", "error");
      }
    } finally {
      setImporting(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail, name: addName }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Subscriber added");
        setShowAdd(false);
        setAddEmail("");
        setAddName("");
        load();
      } else {
        toast(data.error ?? "Could not add subscriber", "error");
      }
    } finally {
      setAddLoading(false);
    }
  }

  async function updateStatus(id: string, nextStatus: "ACTIVE" | "UNSUBSCRIBED") {
    const res = await fetch(`/api/admin/subscribers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      toast(nextStatus === "UNSUBSCRIBED" ? "Marked unsubscribed" : "Marked active");
      load();
    } else {
      toast("Update failed", "error");
    }
  }

  async function deleteSubscriber(id: string, email: string) {
    if (!window.confirm(`Delete ${email} from the mailing list?`)) return;
    const res = await fetch(`/api/admin/subscribers/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Subscriber deleted");
      load();
    } else {
      toast("Delete failed", "error");
    }
  }

  function handleFileUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function closeImportModal() {
    setShowImport(false);
    setImportText("");
    setImportResult(null);
  }

  const listLabel =
    status === "ACTIVE" ? "active" : status === "UNSUBSCRIBED" ? "unsubscribed" : "";

  const description =
    tabCounts.ACTIVE > 0
      ? `${tabCounts.ACTIVE} active · ${tabCounts.all} total`
      : tabCounts.all > 0
        ? `${tabCounts.all} subscriber${tabCounts.all === 1 ? "" : "s"}`
        : "Sign-ups from the popup and imports";

  if (loading && items.length === 0 && !loadError) return <AdminSkeleton rows={8} />;

  if (loadError && items.length === 0) {
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
        title="Mailing list"
        description={description}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="admin-toolbar-btn"
            >
              <Upload className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              Import
            </button>
            <button
              type="button"
              onClick={() => exportCsv(selected.size ? [...selected] : undefined)}
              className="admin-toolbar-btn"
            >
              Export{selected.size ? ` (${selected.size})` : ""}
            </button>
            <button type="button" onClick={() => setShowAdd(true)} className="admin-btn-primary">
              Add subscriber
            </button>
          </div>
        }
      />

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-dark-border p-4 sm:p-5">
          <div className="admin-segmented w-fit max-w-full overflow-x-auto">
            {STATUS_TABS.map((tab) => {
              const active = status === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onStatusChange(tab.value)}
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
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
            />
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>
                {selected.size} selected
              </span>
              <button
                type="button"
                onClick={() => exportCsv([...selected])}
                className="admin-link-accent"
              >
                Export selected
              </button>
              <button type="button" onClick={() => setSelected(new Set())} className="admin-link-accent">
                Clear selection
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-4 sm:p-5">
            <AdminSkeleton rows={5} />
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-5">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-dark-border bg-dark text-muted">
              <Mail className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-muted">
              {search || status !== "ALL"
                ? "No subscribers match your filters."
                : "No subscribers yet. They'll appear here when someone signs up via the popup."}
            </p>
            {(search || status !== "ALL") && (
              <button type="button" onClick={clearFilters} className="admin-link-accent mt-3">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[40rem]">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && selected.size === items.length}
                        onChange={toggleSelectAll}
                        aria-label="Select all on page"
                      />
                    </th>
                    <th>Subscriber</th>
                    <th>Status</th>
                    <th className="hidden md:table-cell">Source</th>
                    <th className="hidden lg:table-cell">Subscribed</th>
                    <th className="w-12" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(sub.id)}
                          onChange={() => toggleSelect(sub.id)}
                          aria-label={`Select ${sub.email}`}
                        />
                      </td>
                      <td className="min-w-[12rem]">
                        <p className="font-medium text-white">{sub.email}</p>
                        <p className="mt-0.5 text-[13px] text-muted">
                          {sub.name ?? "No name"}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-dim md:hidden">
                          {formatSource(sub.source)} ·{" "}
                          {new Date(sub.subscribedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                      <td>
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            sub.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-dark-border/80 text-muted"
                          }`}
                        >
                          {sub.status === "ACTIVE" ? "Active" : "Unsubscribed"}
                        </span>
                      </td>
                      <td className="hidden text-muted md:table-cell">
                        {formatSource(sub.source)}
                      </td>
                      <td className="hidden text-muted lg:table-cell">
                        {new Date(sub.subscribedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="text-right">
                        <SubscriberRowActions
                          subscriber={sub}
                          onUpdateStatus={updateStatus}
                          onDelete={deleteSubscriber}
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
                  {listLabel ? ` · ${total} ${listLabel}` : total !== tabCounts.all ? ` · ${total} shown` : ""}
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

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowAdd(false)}
        >
          <form
            onSubmit={handleAdd}
            className="admin-card w-full max-w-md admin-card-pad"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-section-title">Add subscriber</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-sm text-muted">Email</label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Name (optional)</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Jane Doe"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="submit"
                disabled={addLoading}
                className="admin-btn-primary disabled:opacity-50"
              >
                {addLoading ? "Adding…" : "Add subscriber"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="admin-toolbar-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeImportModal}
        >
          <div
            className="admin-card max-h-[90vh] w-full max-w-2xl overflow-y-auto admin-card-pad"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-section-title">Import subscribers</h2>
            <p className="mt-2 text-sm text-muted">
              Upload or paste CSV with columns: Email, Name, Status (optional), Source (optional)
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="mt-4 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-dark-border file:bg-dark file:px-3 file:py-1.5 file:text-sm file:text-white"
            />
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={8}
              placeholder={"Email,Name,Status,Source\njane@example.com,Jane,ACTIVE,import"}
              className="mt-3 w-full rounded-lg border border-dark-border bg-dark px-3 py-2 font-mono text-xs text-white focus:border-neon/40 focus:outline-none"
            />
            {importTotal > 0 && (
              <p className="mt-2 text-sm text-muted">
                {importTotal} row{importTotal === 1 ? "" : "s"} ready
                {importPreview.length > 0 && (
                  <span>
                    {" "}
                    · preview: {importPreview.map((r) => r.email).join(", ")}
                  </span>
                )}
              </p>
            )}
            {importResult && <p className="mt-2 text-sm text-neon">{importResult}</p>}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => void handleImport()}
                disabled={importing}
                className="admin-btn-primary disabled:opacity-50"
              >
                {importing ? "Importing…" : "Import"}
              </button>
              <button type="button" onClick={closeImportModal} className="admin-toolbar-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriberRowActions({
  subscriber,
  onUpdateStatus,
  onDelete,
}: {
  subscriber: NewsletterSubscriber;
  onUpdateStatus: (id: string, status: "ACTIVE" | "UNSUBSCRIBED") => void;
  onDelete: (id: string, email: string) => void;
}) {
  return (
    <AdminRowActionsMenu label={`Actions for ${subscriber.email}`}>
      {(close) => (
        <>
          {subscriber.status === "ACTIVE" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                void onUpdateStatus(subscriber.id, "UNSUBSCRIBED");
              }}
              className="admin-menu-item w-full"
            >
              <UserMinus className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              Unsubscribe
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                void onUpdateStatus(subscriber.id, "ACTIVE");
              }}
              className="admin-menu-item w-full"
            >
              <UserPlus className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              Reactivate
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              void onDelete(subscriber.id, subscriber.email);
            }}
            className="admin-menu-item w-full text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Delete
          </button>
        </>
      )}
    </AdminRowActionsMenu>
  );
}

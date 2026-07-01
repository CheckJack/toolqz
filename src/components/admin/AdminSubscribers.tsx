"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";
import { parseCsv } from "@/lib/csv-parse";
import { parseSubscriberImportRow } from "@/lib/subscribers";
import { NewsletterSubscriber, SubscriberImportRow } from "@/types/subscriber";

const PAGE_SIZE = 25;

function parseImportCsv(text: string): SubscriberImportRow[] {
  const rows = parseCsv(text.trim());
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows
    .slice(1)
    .map((cols) => parseSubscriberImportRow(headers, cols))
    .filter((row): row is SubscriberImportRow => row !== null);
}

export function AdminSubscribers() {
  const { toast } = useToast();
  const [items, setItems] = useState<NewsletterSubscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
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
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
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
        setActiveCount(data.activeCount ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => toast("Failed to load mailing list", "error"))
      .finally(() => setLoading(false));
  }, [page, search, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [search, status]);

  const importPreview = useMemo(() => parseImportCsv(importText).slice(0, 5), [importText]);
  const importTotal = useMemo(() => parseImportCsv(importText).length, [importText]);

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

  if (loading && !items.length) return <AdminSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mailing list</h1>
          <p className="mt-1 text-sm text-muted">
            {activeCount} active · {total} total subscribers from the popup and imports
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-ink"
          >
            Add subscriber
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
          >
            Import
          </button>
          <button
            onClick={() => exportCsv(selected.size ? [...selected] : undefined)}
            className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
          >
            Export{selected.size ? ` (${selected.size})` : " all"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-sm text-white placeholder:text-muted/60"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-sm text-white"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="UNSUBSCRIBED">Unsubscribed</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-dark-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-dark-border bg-dark-elevated text-muted">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Source</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Subscribed</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((sub) => (
              <tr key={sub.id} className="border-b border-dark-border/60 last:border-0">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(sub.id)}
                    onChange={() => toggleSelect(sub.id)}
                    aria-label={`Select ${sub.email}`}
                  />
                </td>
                <td className="px-4 py-3 text-white">{sub.email}</td>
                <td className="hidden px-4 py-3 text-muted sm:table-cell">{sub.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      sub.status === "ACTIVE"
                        ? "bg-neon/10 text-neon"
                        : "bg-dark-border text-muted"
                    }`}
                  >
                    {sub.status === "ACTIVE" ? "Active" : "Unsubscribed"}
                  </span>
                </td>
                <td className="hidden px-4 py-3 capitalize text-muted md:table-cell">
                  {sub.source}
                </td>
                <td className="hidden px-4 py-3 text-muted lg:table-cell">
                  {new Date(sub.subscribedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {sub.status === "ACTIVE" ? (
                      <button
                        onClick={() => updateStatus(sub.id, "UNSUBSCRIBED")}
                        className="text-xs text-muted hover:text-white"
                      >
                        Unsubscribe
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(sub.id, "ACTIVE")}
                        className="text-xs text-neon hover:underline"
                      >
                        Reactivate
                      </button>
                    )}
                    <button
                      onClick={() => deleteSubscriber(sub.id, sub.email)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No subscribers yet. They&apos;ll appear here when someone signs up via the popup.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-dark-border px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-dark-border px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowAdd(false)}
        >
          <form
            onSubmit={handleAdd}
            className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-elevated p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Add subscriber</h2>
            <div className="space-y-3">
              <input
                type="email"
                required
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-sm text-white"
              />
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Name (optional)"
                className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-sm text-white"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={addLoading}
                className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                {addLoading ? "Adding…" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            setShowImport(false);
            setImportText("");
            setImportResult(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-dark-border bg-dark-elevated p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold text-white">Import subscribers</h2>
            <p className="mb-4 text-sm text-muted">
              Upload or paste CSV with columns: Email, Name, Status (optional), Source (optional)
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="mb-3 block w-full text-sm text-muted"
            />
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={8}
              placeholder="Email,Name,Status,Source&#10;jane@example.com,Jane,ACTIVE,import"
              className="w-full rounded-xl border border-dark-border bg-dark px-4 py-3 font-mono text-xs text-white"
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
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleImport}
                disabled={importing}
                className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                {importing ? "Importing…" : "Import"}
              </button>
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportText("");
                  setImportResult(null);
                }}
                className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SessionUser } from "@/lib/auth";
import { formatMoney } from "@/lib/finance";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";

interface FinanceEntry {
  id: string;
  type: "EARNING" | "EXPENSE";
  amount: number;
  currency: string;
  description: string;
  source: string | null;
  affiliateProgramId: string | null;
  occurredAt: string;
  notes: string | null;
  affiliateProgram: { id: string; companyName: string } | null;
  createdBy: { id: string; name: string } | null;
}

interface FinanceSummary {
  earnings: number;
  expenses: number;
  balance: number;
}

interface AffiliateOption {
  id: string;
  companyName: string;
}

const emptyForm = {
  type: "EARNING" as "EARNING" | "EXPENSE",
  amount: "",
  description: "",
  source: "",
  occurredAt: new Date().toISOString().slice(0, 10),
  notes: "",
  affiliateProgramId: "",
};

export function AdminFinances({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const isAdmin = user.role === "ADMIN";
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"" | "EARNING" | "EXPENSE">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (filter) params.set("type", filter);
    fetch(`/api/admin/finances?${params}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setEntries(data.items ?? []);
        setSummary(data.summary ?? null);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() =>
        setError(
          "Failed to load finances. Restart the dev server with npm run dev:clean if this page was just added."
        )
      )
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/affiliates?pageSize=100&sort=name")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.items) {
          setAffiliates(
            data.items.map((a: { id: string; companyName: string }) => ({
              id: a.id,
              companyName: a.companyName,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          affiliateProgramId: form.affiliateProgramId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Could not save entry");
        return;
      }
      setForm({ ...emptyForm, occurredAt: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      if (data.summary) setSummary(data.summary);
      toast(form.type === "EARNING" ? "Earning added" : "Expense added");
      load();
    } finally {
      setSaving(false);
    }
  }

  function openEdit(entry: FinanceEntry) {
    setEditId(entry.id);
    setEditForm({
      type: entry.type,
      amount: String(entry.amount),
      description: entry.description,
      source: entry.source ?? "",
      occurredAt: entry.occurredAt.slice(0, 10),
      notes: entry.notes ?? "",
      affiliateProgramId: entry.affiliateProgramId ?? "",
    });
  }

  async function handleEditSave() {
    if (!editId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/finances/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          affiliateProgramId: editForm.affiliateProgramId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Update failed", "error");
        return;
      }
      setEditId(null);
      toast("Entry updated");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, description: string) {
    if (!confirm(`Delete "${description}"?`)) return;
    const res = await fetch(`/api/admin/finances/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(data.error ?? "Delete failed", "error");
      return;
    }
    toast("Entry deleted");
    load();
  }

  if (loading && !summary) return <AdminSkeleton rows={8} />;

  if (error && !summary) {
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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Finances</h1>
          <p className="text-muted">
            Track affiliate earnings and expenses manually — net balance updates as you add entries.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-ink hover:bg-neon-dim"
        >
          {showForm ? "Cancel" : "Add entry"}
        </button>
      </div>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
            <p className="text-sm text-muted">Affiliate earnings</p>
            <p className="mt-1 text-3xl font-bold text-emerald-400">
              {formatMoney(summary.earnings)}
            </p>
          </div>
          <div className="rounded-2xl border border-dark-border bg-dark-elevated p-5">
            <p className="text-sm text-muted">Expenses</p>
            <p className="mt-1 text-3xl font-bold text-red-400">
              {formatMoney(summary.expenses)}
            </p>
          </div>
          <div className="rounded-2xl border border-neon/30 bg-neon/5 p-5">
            <p className="text-sm text-muted">Net balance</p>
            <p
              className={`mt-1 text-3xl font-bold ${
                summary.balance >= 0 ? "text-neon" : "text-red-400"
              }`}
            >
              {formatMoney(summary.balance)}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-2xl border border-dark-border bg-dark-elevated p-6"
        >
          <h2 className="font-semibold text-white">New entry</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm text-muted">Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as "EARNING" | "EXPENSE" })
                }
                className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
              >
                <option value="EARNING">Earning (affiliate income)</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted">Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted">Date</label>
              <input
                type="date"
                value={form.occurredAt}
                onChange={(e) => setForm({ ...form, occurredAt: e.target.value })}
                className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-muted">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                placeholder="e.g. March commission payout"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted">Source / payee</label>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                placeholder="e.g. Amazon Associates, Vercel"
              />
            </div>
            {form.type === "EARNING" && affiliates.length > 0 && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm text-muted">Link to affiliate program (optional)</label>
                <select
                  value={form.affiliateProgramId}
                  onChange={(e) => setForm({ ...form, affiliateProgramId: e.target.value })}
                  className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                >
                  <option value="">— None —</option>
                  {affiliates.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.companyName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1.5 block text-sm text-muted">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                placeholder="Invoice #, payment method, etc."
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save entry"}
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {(["", "EARNING", "EXPENSE"] as const).map((value) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => {
              setFilter(value);
              setPage(1);
            }}
            className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
              filter === value
                ? "border-neon/50 bg-neon/10 text-neon"
                : "border-dark-border text-muted hover:text-white"
            }`}
          >
            {value === "" ? "All" : value === "EARNING" ? "Earnings" : "Expenses"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated">
        {entries.length === 0 ? (
          <p className="p-12 text-center text-muted">
            No entries yet. Add an earning or expense to start tracking your balance.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left text-muted">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-dark-border/50 last:border-0">
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {new Date(entry.occurredAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          entry.type === "EARNING"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {entry.type === "EARNING" ? "Earning" : "Expense"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>{entry.description}</div>
                      {entry.affiliateProgram && (
                        <Link
                          href={`/admin/affiliates/${entry.affiliateProgram.id}`}
                          className="text-xs text-neon hover:underline"
                        >
                          {entry.affiliateProgram.companyName}
                        </Link>
                      )}
                      {entry.notes && (
                        <p className="mt-0.5 text-xs text-muted line-clamp-1">{entry.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{entry.source ?? "—"}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        entry.type === "EARNING" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {entry.type === "EARNING" ? "+" : "−"}
                      {formatMoney(entry.amount, entry.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(entry)}
                          className="text-xs text-muted hover:text-white"
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(entry.id, entry.description)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-dark-border px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-dark-border px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-dark-border bg-dark-elevated p-6">
            <h3 className="mb-4 font-semibold text-white">Edit entry</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-muted">Type</label>
                <select
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, type: e.target.value as "EARNING" | "EXPENSE" })
                  }
                  className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                >
                  <option value="EARNING">Earning</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Date</label>
                <input
                  type="date"
                  value={editForm.occurredAt}
                  onChange={(e) => setEditForm({ ...editForm, occurredAt: e.target.value })}
                  className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Description</label>
                <input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted">Source / payee</label>
                <input
                  value={editForm.source}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                  className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                />
              </div>
              {editForm.type === "EARNING" && affiliates.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm text-muted">Affiliate program</label>
                  <select
                    value={editForm.affiliateProgramId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, affiliateProgramId: e.target.value })
                    }
                    className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                  >
                    <option value="">— None —</option>
                    {affiliates.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm text-muted">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-dark-border bg-dark px-4 py-2.5 text-white"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => void handleEditSave()}
                disabled={saving}
                className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

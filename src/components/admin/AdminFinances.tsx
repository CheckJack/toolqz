"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { formatMoney } from "@/lib/finance";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminChartCard } from "@/components/admin/charts/AdminChartCard";
import { DonutBreakdownChart } from "@/components/admin/charts/DonutBreakdownChart";
import { FinanceTrendChart } from "@/components/admin/charts/FinanceTrendChart";
import { useToast } from "@/components/admin/Toast";
import { CHART } from "@/lib/admin-charts";

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

interface FinanceTrendRow {
  month: string;
  label: string;
  earnings: number;
  expenses: number;
  net: number;
}

interface AffiliateOption {
  id: string;
  companyName: string;
}

type TypeTab = "" | "EARNING" | "EXPENSE";

const TYPE_TABS: { value: TypeTab; label: string }[] = [
  { value: "", label: "All" },
  { value: "EARNING", label: "Earnings" },
  { value: "EXPENSE", label: "Expenses" },
];

const emptyForm = {
  type: "EARNING" as "EARNING" | "EXPENSE",
  amount: "",
  description: "",
  source: "",
  occurredAt: new Date().toISOString().slice(0, 10),
  notes: "",
  affiliateProgramId: "",
};

const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/40 focus:outline-none";

export function AdminFinances({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const isAdmin = user.role === "ADMIN";
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<FinanceTrendRow[]>([]);
  const [tabCounts, setTabCounts] = useState({ all: 0, EARNING: 0, EXPENSE: 0 });
  const [affiliates, setAffiliates] = useState<AffiliateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<TypeTab>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (filter) params.set("type", filter);
    if (search) params.set("search", search);
    fetch(`/api/admin/finances?${params}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setEntries(data.items ?? []);
        setSummary(data.summary ?? null);
        setMonthlyTrend(data.monthlyTrend ?? []);
        setTabCounts(
          data.counts ?? {
            all: data.total ?? 0,
            EARNING: 0,
            EXPENSE: 0,
          }
        );
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() =>
        setError(
          "Failed to load finances. Restart the dev server with npm run dev:clean if this page was just added."
        )
      )
      .finally(() => setLoading(false));
  }, [filter, page, search]);

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

  function setTypeTab(value: TypeTab) {
    setFilter(value);
    setPage(1);
  }

  function tabCount(value: TypeTab): number {
    if (value === "EARNING") return tabCounts.EARNING;
    if (value === "EXPENSE") return tabCounts.EXPENSE;
    return tabCounts.all;
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setFilter("");
    setPage(1);
  }

  const listLabel =
    filter === "EARNING" ? "earning" : filter === "EXPENSE" ? "expense" : "";

  if (loading && !summary) return <AdminSkeleton rows={8} />;

  if (error && !summary) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {error}
        <button type="button" onClick={load} className="mt-2 block w-full text-sm text-neon">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Finances"
        description="Track affiliate earnings and expenses — net balance updates as you add entries."
        action={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className={showForm ? "admin-toolbar-btn" : "admin-btn-primary"}
          >
            {showForm ? "Cancel" : "Add entry"}
          </button>
        }
      />

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="admin-card admin-card-pad">
              <p className="admin-stat-label">Affiliate earnings</p>
              <p className="admin-stat-value text-emerald-400">{formatMoney(summary.earnings)}</p>
            </div>
            <div className="admin-card admin-card-pad">
              <p className="admin-stat-label">Expenses</p>
              <p className="admin-stat-value text-red-400">{formatMoney(summary.expenses)}</p>
            </div>
            <div className="admin-card admin-card-pad border-neon/20 bg-neon/5">
              <p className="admin-stat-label">Net balance</p>
              <p
                className={`admin-stat-value ${
                  summary.balance >= 0 ? "text-neon" : "text-red-400"
                }`}
              >
                {formatMoney(summary.balance)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <AdminChartCard
              title="12-month cash flow"
              description="Earnings, expenses, and net trend"
              className="lg:col-span-2"
            >
              <FinanceTrendChart data={monthlyTrend} />
            </AdminChartCard>

            <AdminChartCard title="Balance breakdown" description="Share of total volume">
              <DonutBreakdownChart
                data={[
                  { name: "Earnings", value: summary.earnings, color: CHART.success },
                  { name: "Expenses", value: summary.expenses, color: CHART.danger },
                ]}
                valueLabel="Amount"
                height={260}
              />
            </AdminChartCard>
          </div>
        </>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="admin-card admin-card-pad space-y-4">
          <h2 className="admin-section-title">New entry</h2>
          <FinanceEntryFields
            form={form}
            onChange={setForm}
            affiliates={affiliates}
            inputClass={inputClass}
          />
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="admin-btn-primary disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save entry"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="admin-toolbar-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-dark-border p-4 sm:p-5">
          <div className="admin-segmented w-fit max-w-full overflow-x-auto">
            {TYPE_TABS.map((tab) => {
              const active = filter === tab.value;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setTypeTab(tab.value)}
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
              placeholder="Search description, source, or notes…"
              className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-4 sm:p-5">
            <AdminSkeleton rows={5} />
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-5">
            <p className="text-sm text-muted">
              {search || filter
                ? `No ${listLabel ? `${listLabel} ` : ""}entries match your filters.`
                : "No entries yet. Add an earning or expense to start tracking."}
            </p>
            {(search || filter) && (
              <button type="button" onClick={clearFilters} className="admin-link-accent mt-3">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[680px]">
                <thead>
                  <tr>
                    <th>Entry</th>
                    <th className="hidden sm:table-cell">Source</th>
                    <th className="hidden md:table-cell">Date</th>
                    <th className="text-right">Amount</th>
                    <th className="w-12" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="min-w-[14rem]">
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 inline-flex shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                              entry.type === "EARNING"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {entry.type === "EARNING" ? "In" : "Out"}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-white">{entry.description}</p>
                            {entry.affiliateProgram && (
                              <Link
                                href={`/admin/affiliates/${entry.affiliateProgram.id}`}
                                className="mt-0.5 block text-[11px] text-neon hover:underline"
                              >
                                {entry.affiliateProgram.companyName}
                              </Link>
                            )}
                            {entry.notes && (
                              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">
                                {entry.notes}
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-muted sm:hidden">
                              {entry.source ?? "—"}
                              {" · "}
                              {new Date(entry.occurredAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden text-muted sm:table-cell">{entry.source ?? "—"}</td>
                      <td className="hidden whitespace-nowrap text-muted md:table-cell">
                        {new Date(entry.occurredAt).toLocaleDateString()}
                      </td>
                      <td
                        className={`text-right font-semibold tabular-nums ${
                          entry.type === "EARNING" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {entry.type === "EARNING" ? "+" : "−"}
                        {formatMoney(entry.amount, entry.currency)}
                      </td>
                      <td className="w-12 text-right">
                        <FinanceRowActions
                          entry={entry}
                          isAdmin={isAdmin}
                          onEdit={() => openEdit(entry)}
                          onDelete={() => void handleDelete(entry.id, entry.description)}
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
                    onClick={() => setPage((p) => p - 1)}
                    className="admin-toolbar-btn disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
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

      {editId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setEditId(null)}
        >
          <div
            className="admin-card max-h-[90vh] w-full max-w-lg overflow-y-auto admin-card-pad"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="admin-section-title">Edit entry</h3>
            <div className="mt-4 space-y-4">
              <FinanceEntryFields
                form={editForm}
                onChange={setEditForm}
                affiliates={affiliates}
                inputClass={inputClass}
              />
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => void handleEditSave()}
                disabled={saving}
                className="admin-btn-primary disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button type="button" onClick={() => setEditId(null)} className="admin-toolbar-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceEntryFields({
  form,
  onChange,
  affiliates,
  inputClass,
}: {
  form: typeof emptyForm;
  onChange: (form: typeof emptyForm) => void;
  affiliates: AffiliateOption[];
  inputClass: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="mb-1.5 block text-sm text-muted">Type</label>
        <select
          value={form.type}
          onChange={(e) => onChange({ ...form, type: e.target.value as "EARNING" | "EXPENSE" })}
          className={inputClass}
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
          onChange={(e) => onChange({ ...form, amount: e.target.value })}
          className={inputClass}
          placeholder="0.00"
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-muted">Date</label>
        <input
          type="date"
          value={form.occurredAt}
          onChange={(e) => onChange({ ...form, occurredAt: e.target.value })}
          className={inputClass}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm text-muted">Description</label>
        <input
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          className={inputClass}
          placeholder="e.g. March commission payout"
          required
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-muted">Source / payee</label>
        <input
          value={form.source}
          onChange={(e) => onChange({ ...form, source: e.target.value })}
          className={inputClass}
          placeholder="e.g. Amazon Associates"
        />
      </div>
      {form.type === "EARNING" && affiliates.length > 0 && (
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1.5 block text-sm text-muted">
            Link to affiliate program (optional)
          </label>
          <select
            value={form.affiliateProgramId}
            onChange={(e) => onChange({ ...form, affiliateProgramId: e.target.value })}
            className={inputClass}
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
          onChange={(e) => onChange({ ...form, notes: e.target.value })}
          rows={2}
          className={inputClass}
          placeholder="Invoice #, payment method, etc."
        />
      </div>
    </div>
  );
}

function FinanceRowActions({
  entry,
  isAdmin,
  onEdit,
  onDelete,
}: {
  entry: FinanceEntry;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <AdminRowActionsMenu label={`Actions for ${entry.description}`}>
      {(close) => (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onEdit();
            }}
            className="admin-menu-item w-full"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Edit entry
          </button>
          {isAdmin && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                onDelete();
              }}
              className="admin-menu-item w-full text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              Delete
            </button>
          )}
        </>
      )}
    </AdminRowActionsMenu>
  );
}

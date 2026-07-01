"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminAffiliateForm,
  emptyForm,
  formToPayload,
  AffiliateFormData,
} from "@/components/admin/AdminAffiliateForm";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { AdminAffiliateKanban } from "@/components/admin/AdminAffiliateKanban";
import { useToast } from "@/components/admin/Toast";
import { AFFILIATE_CATEGORIES } from "@/constants/affiliate-categories";
import { parseCsv } from "@/lib/csv-parse";
import { parseAffiliateXlsx } from "@/lib/parse-xlsx";
import { canEditAffiliateRow } from "@/lib/affiliate-access";
import { SessionUser } from "@/lib/auth";
import {
  AFFILIATE_PRIORITIES,
  AFFILIATE_STATUSES,
  AffiliateImportRow,
  AffiliateProgram,
  AffiliateUser,
} from "@/types/affiliate";
import { isFollowUpDueThisWeek, isFollowUpOverdue } from "@/lib/affiliates";

function affiliateSignupUrl(program: { signupUrl: string | null; website: string | null }) {
  const url = program.signupUrl?.trim() || program.website?.trim();
  return url || null;
}

const PAGE_SIZE = 25;

type RowPendingEdit = {
  status?: string;
  assignedToId?: string | null;
};

function rowHasPending(a: AffiliateProgram, pending?: RowPendingEdit): boolean {
  if (!pending) return false;
  if (pending.status !== undefined && pending.status !== a.status) return true;
  if (
    pending.assignedToId !== undefined &&
    (pending.assignedToId ?? "") !== (a.assignedToId ?? "")
  ) {
    return true;
  }
  return false;
}

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10",
  IN_PROGRESS: "text-blue-400 bg-blue-400/10",
  APPLIED: "text-purple-400 bg-purple-400/10",
  ACTIVE: "text-neon bg-neon/10",
  REJECTED: "text-red-400 bg-red-400/10",
  PAUSED: "text-muted bg-dark-border",
  NOT_AVAILABLE: "text-orange-400 bg-orange-400/10",
  ON_HOLD: "text-amber-400 bg-amber-400/10",
};

function parseImportCsv(text: string): AffiliateImportRow[] {
  const rows = parseCsv(text.trim());
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) =>
    headers.findIndex((h) => names.some((n) => h.includes(n)));

  const iName = idx(["company"]);
  const iCat = idx(["category"]);
  const iComm = idx(["commission"]);
  const iRec = idx(["recurring"]);
  const iCookie = idx(["cookie"]);
  const iSignup = idx(["signup"]);
  const iNotes = idx(["notes"]);

  return rows.slice(1).flatMap((cols) => {
    const name = cols[iName >= 0 ? iName : 0]?.trim();
    if (!name) return [];
    return [{
      companyName: name,
      category: iCat >= 0 ? cols[iCat]?.trim() : undefined,
      commission: iComm >= 0 ? cols[iComm]?.trim() : undefined,
      recurring: iRec >= 0 ? cols[iRec]?.trim() : undefined,
      cookieDuration: iCookie >= 0 ? cols[iCookie]?.trim() : undefined,
      signupUrl: iSignup >= 0 ? cols[iSignup]?.trim() : undefined,
      notes: iNotes >= 0 ? cols[iNotes]?.trim() : undefined,
    }];
  });
}

export function AdminAffiliates({ user }: { user: SessionUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isAdmin = user.role === "ADMIN";

  const status = searchParams.get("status") ?? "ALL";
  const priority = searchParams.get("priority") ?? "";
  const category = searchParams.get("category") ?? "";
  const assignee = searchParams.get("assignedToId") ?? "";
  const unassigned = searchParams.get("unassigned") === "true";
  const hasTool = searchParams.get("hasTool") ?? "";
  const followups = searchParams.get("followups") ?? "";
  const mine = searchParams.get("mine") === "true";
  const sort = searchParams.get("sort") ?? "updated";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const view = searchParams.get("view") ?? "list";
  const openCreate = searchParams.get("action") === "create";
  const prefillCompany = searchParams.get("companyName") ?? "";
  const prefillToolId = searchParams.get("toolId") ?? "";
  const prefillWebsite = searchParams.get("website") ?? "";

  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const [affiliates, setAffiliates] = useState<AffiliateProgram[]>([]);
  const [total, setTotal] = useState(0);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<AffiliateUser[]>([]);
  const [tools, setTools] = useState<
    { id: string; name: string; slug: string; published?: boolean; affiliate?: { id: string } | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<AffiliateFormData>(emptyForm);
  const [createError, setCreateError] = useState("");
  const [importing, setImporting] = useState(false);
  const [xlsxRows, setXlsxRows] = useState<AffiliateImportRow[] | null>(null);
  const [pendingEdits, setPendingEdits] = useState<Record<string, RowPendingEdit>>({});
  const [bulkWorking, setBulkWorking] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);

  useEffect(() => {
    setSearchInput(searchParams.get("search") ?? "");
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput || null, page: null });
        setSearch(searchInput);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    router.replace(`/admin/affiliates?${params.toString()}`, { scroll: false });
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("sort")) params.set("sort", "updated");
    params.set("pageSize", String(PAGE_SIZE));

    const [aRes, uRes, tRes] = await Promise.all([
      fetch(`/api/admin/affiliates?${params}`),
      fetch("/api/admin/users"),
      fetch("/api/admin/tools?lite=true"),
    ]);

    if (aRes.ok) {
      const data = await aRes.json();
      setAffiliates(data.items ?? []);
      setTotal(data.total ?? 0);
      setApiCategories(data.categories ?? []);
      setPendingEdits({});
    } else toast("Failed to load programs", "error");
    if (uRes.ok) setUsers(await uRes.json());
    if (tRes.ok) setTools(await tRes.json());
    setLoading(false);
  }, [searchParams, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (openCreate) {
      setShowCreate(true);
      if (prefillCompany) {
        setCreateForm((f) => ({
          ...f,
          companyName: prefillCompany,
          toolId: prefillToolId,
          website: prefillWebsite,
        }));
      }
    }
  }, [openCreate, prefillCompany, prefillToolId, prefillWebsite]);

  useEffect(() => {
    if (!showCreate && !showImport) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showCreate) closeCreateModal();
        else closeImportModal();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCreate, showImport]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function closeImportModal() {
    setShowImport(false);
    setImportText("");
    setImportResult(null);
    setImporting(false);
    setXlsxRows(null);
  }

  function clearPending(id: string) {
    setPendingEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function setRowPending(id: string, patch: RowPendingEdit) {
    setPendingEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function applyRowEdit(a: AffiliateProgram) {
    const pending = pendingEdits[a.id];
    if (!pending || !rowHasPending(a, pending)) {
      clearPending(a.id);
      return;
    }
    const payload: Record<string, unknown> = {};
    if (pending.status !== undefined && pending.status !== a.status) {
      payload.status = pending.status;
    }
    if (
      pending.assignedToId !== undefined &&
      (pending.assignedToId ?? "") !== (a.assignedToId ?? "")
    ) {
      payload.assignedToId = pending.assignedToId || null;
    }
    await quickPatch(a.id, payload);
    clearPending(a.id);
  }

  function closeCreateModal() {
    setShowCreate(false);
    setCreateError("");
    setCreateForm(emptyForm);
    if (openCreate || prefillCompany) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      params.delete("companyName");
      params.delete("toolId");
      params.delete("website");
      router.replace(`/admin/affiliates?${params.toString()}`, { scroll: false });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    const name = createForm.companyName.trim().toLowerCase();
    if (name && affiliates.some((a) => a.companyName.trim().toLowerCase() === name)) {
      setCreateError("A program with this company name already exists.");
      return;
    }
    const res = await fetch("/api/admin/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formToPayload(createForm)),
    });
    const data = await res.json();
    if (!res.ok) {
      setCreateError(data.error ?? "Failed to create");
      return;
    }
    setCreateForm(emptyForm);
    closeCreateModal();
    toast("Program created");
    load();
  }

  async function handleImport() {
    const rows = xlsxRows ?? parseImportCsv(importText);
    if (!rows.length) {
      toast("No valid rows found", "error");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/admin/affiliates/import", {
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
        setXlsxRows(null);
        load();
      } else {
        toast(data.error ?? "Import failed", "error");
      }
    } finally {
      setImporting(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = () => {
        const rows = parseAffiliateXlsx(reader.result as ArrayBuffer);
        if (!rows.length) {
          toast("No rows found in spreadsheet", "error");
          return;
        }
        setXlsxRows(rows);
        setImportText(`[${rows.length} rows loaded from ${file.name}]`);
        toast(`Loaded ${rows.length} rows from Excel`);
      };
      reader.readAsArrayBuffer(file);
      e.target.value = "";
      return;
    }
    setXlsxRows(null);
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function exportCsv(ids?: string[]) {
    let url: string;
    if (ids?.length) {
      url = `/api/admin/affiliates/export?ids=${ids.join(",")}`;
    } else if (activeFilters.length > 0) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      params.delete("pageSize");
      params.delete("view");
      params.delete("idsOnly");
      url = `/api/admin/affiliates/export?${params.toString()}`;
    } else {
      url = "/api/admin/affiliates/export";
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `affiliate-programs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast(ids?.length ? `Exported ${ids.length} programs` : "Export complete");
    } catch {
      toast("Export failed", "error");
    }
  }

  async function bulkAssign(userId: string) {
    if (!userId || !isAdmin) return;
    if (!confirm(`Assign ${selected.size} programs?`)) return;
    setBulkWorking(true);
    const results = await Promise.all(
      [...selected].map((id) =>
        fetch(`/api/admin/affiliates/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedToId: userId || null }),
        }).then((r) => r.ok)
      )
    );
    const ok = results.filter(Boolean).length;
    setSelected(new Set());
    setBulkWorking(false);
    toast(ok === results.length ? "Bulk assign complete" : `${ok}/${results.length} assigned`, ok === results.length ? "success" : "error");
    load();
  }

  async function bulkStatus(newStatus: string) {
    if (!newStatus || !isAdmin) return;
    const selectedPrograms = affiliates.filter((a) => selected.has(a.id));
    if (newStatus === "ACTIVE") {
      const withoutUrl = selectedPrograms.filter((a) => !a.affiliateUrl);
      if (withoutUrl.length > 0) {
        if (
          !confirm(
            `${withoutUrl.length} of ${selected.size} selected programs have no affiliate tracking URL. Set all to ACTIVE anyway?`
          )
        ) {
          return;
        }
      }
    }
    if (!confirm(`Change status of ${selected.size} programs to ${newStatus.replace(/_/g, " ")}?`)) return;
    setBulkWorking(true);
    const results = await Promise.all(
      [...selected].map((id) =>
        fetch(`/api/admin/affiliates/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }).then((r) => r.ok)
      )
    );
    const ok = results.filter(Boolean).length;
    setSelected(new Set());
    setBulkWorking(false);
    toast(
      ok === results.length ? "Bulk status update complete" : `${ok}/${results.length} updated`,
      ok === results.length ? "success" : "error"
    );
    load();
  }

  async function quickPatch(
    id: string,
    payload: Record<string, unknown>,
    options?: { silent?: boolean }
  ): Promise<boolean> {
    if (payload.status === "ACTIVE") {
      const program = affiliates.find((a) => a.id === id);
      if (program && !program.affiliateUrl && !payload.affiliateUrl) {
        if (
          !confirm(
            `Set "${program.companyName}" to ACTIVE without an affiliate tracking URL? You can add the URL on the detail page.`
          )
        ) {
          return false;
        }
      }
    }

    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      if (!options?.silent) toast("Updated");
      setPendingEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      load();
      return true;
    }
    if (!options?.silent) toast("Update failed", "error");
    return false;
  }

  const previewRows = useMemo(
    () => (xlsxRows ?? parseImportCsv(importText)).slice(0, 5),
    [importText, xlsxRows]
  );
  const importTotal = useMemo(
    () => (xlsxRows ?? parseImportCsv(importText)).length,
    [importText, xlsxRows]
  );

  const categoryOptions = useMemo(() => {
    const merged = new Set([...AFFILIATE_CATEGORIES, ...apiCategories]);
    return [...merged].sort();
  }, [apiCategories]);

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; clear: Record<string, string | null> }[] = [];
    if (search) chips.push({ key: "search", label: `Search: ${search}`, clear: { search: null } });
    if (status !== "ALL") chips.push({ key: "status", label: status.replace(/_/g, " "), clear: { status: null } });
    if (priority) chips.push({ key: "priority", label: `Priority: ${priority}`, clear: { priority: null } });
    if (category) chips.push({ key: "category", label: `Category: ${category}`, clear: { category: null } });
    if (assignee) {
      const name = users.find((u) => u.id === assignee)?.name ?? "Assignee";
      chips.push({ key: "assignedToId", label: name, clear: { assignedToId: null } });
    }
    if (hasTool === "true") chips.push({ key: "hasTool", label: "Has tool", clear: { hasTool: null } });
    if (hasTool === "false") chips.push({ key: "hasTool", label: "No tool", clear: { hasTool: null } });
    if (unassigned) chips.push({ key: "unassigned", label: "Unassigned", clear: { unassigned: null } });
    if (mine) chips.push({ key: "mine", label: "My assignments", clear: { mine: null } });
    if (followups === "due") chips.push({ key: "followups", label: "Follow-ups due", clear: { followups: null } });
    return chips;
  }, [search, status, priority, category, assignee, hasTool, unassigned, mine, followups, users]);

  const allPageSelected =
    affiliates.length > 0 && affiliates.every((a) => selected.has(a.id));

  function toggleSelectAllPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) affiliates.forEach((a) => next.delete(a.id));
      else affiliates.forEach((a) => next.add(a.id));
      return next;
    });
  }

  async function selectAllMatching() {
    setSelectingAll(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("idsOnly", "true");
    params.delete("page");
    params.delete("pageSize");
    try {
      const res = await fetch(`/api/admin/affiliates?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setSelected(new Set(data.ids ?? []));
      toast(`Selected ${data.total ?? data.ids?.length ?? 0} programs`);
    } catch {
      toast("Failed to select all matching", "error");
    } finally {
      setSelectingAll(false);
    }
  }

  const allMatchingSelected = total > 0 && selected.size === total;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Affiliate CRM</h1>
          <p className="text-muted">
            {total} program{total === 1 ? "" : "s"}
            {view === "kanban"
              ? " · kanban view"
              : total !== affiliates.length
                ? ` · showing ${affiliates.length} on this page`
                : ""}
          </p>
          <div className="mt-2 inline-flex rounded-lg border border-dark-border p-0.5 text-sm">
            <button
              type="button"
              onClick={() => updateParams({ view: null, page: null })}
              className={`rounded-md px-3 py-1 ${view !== "kanban" ? "bg-neon/10 text-neon" : "text-muted"}`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => updateParams({ view: "kanban", page: null })}
              className={`rounded-md px-3 py-1 ${view === "kanban" ? "bg-neon/10 text-neon" : "text-muted"}`}
            >
              Kanban
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowCreate(true)} className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-ink">
            + Add program
          </button>
          {isAdmin && (
            <button onClick={() => setShowImport(true)} className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white">
              Import
            </button>
          )}
          <button onClick={() => exportCsv(selected.size ? [...selected] : undefined)} className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white">
            Export{selected.size ? ` (${selected.size})` : " all"}
          </button>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => updateParams({ ...chip.clear, page: null })}
              className="inline-flex items-center gap-1 rounded-full border border-dark-border bg-dark-elevated px-3 py-1 text-xs text-muted hover:border-neon/30 hover:text-white"
            >
              {chip.label}
              <span aria-hidden>×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.replace("/admin/affiliates")}
            className="text-xs text-neon hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-dark-border bg-dark-elevated p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search company..."
          className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/50 focus:outline-none sm:col-span-2"
        />
        <select value={status} onChange={(e) => updateParams({ status: e.target.value === "ALL" ? null : e.target.value, page: null })} className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white">
          <option value="ALL">All statuses</option>
          {AFFILIATE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => updateParams({ sort: e.target.value })} className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white">
          <option value="updated">Last updated</option>
          <option value="name">Company name</option>
          <option value="followup">Next follow-up</option>
          <option value="priority">Priority</option>
        </select>
        <select value={priority} onChange={(e) => updateParams({ priority: e.target.value || null, page: null })} className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white">
          <option value="">All priorities</option>
          {AFFILIATE_PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => updateParams({ category: e.target.value || null, page: null })} className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white">
          <option value="">All categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={assignee} onChange={(e) => updateParams({ assignedToId: e.target.value || null, page: null })} className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white">
          <option value="">All assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select value={hasTool} onChange={(e) => updateParams({ hasTool: e.target.value || null, page: null })} className="rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white">
          <option value="">All programs</option>
          <option value="true">Has linked tool</option>
          <option value="false">No linked tool</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={unassigned}
            onChange={(e) => {
              const on = e.target.checked;
              updateParams({
                unassigned: on ? "true" : null,
                ...(on ? { mine: null } : {}),
                page: null,
              });
            }}
          />
          Unassigned only
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => {
              const on = e.target.checked;
              updateParams({
                mine: on ? "true" : null,
                ...(on ? { unassigned: null } : {}),
                page: null,
              });
            }}
          />
          My assignments
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={followups === "due"} onChange={(e) => updateParams({ followups: e.target.checked ? "due" : null, page: null })} />
          Follow-ups due (7 days)
        </label>
      </div>

      {selected.size > 0 && isAdmin && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neon/20 bg-neon/5 p-3 text-sm">
          <span>{selected.size} selected{bulkWorking ? " · updating…" : ""}</span>
          {total > affiliates.length && !allMatchingSelected && (
            <button
              type="button"
              onClick={selectAllMatching}
              disabled={selectingAll}
              className="text-neon hover:underline disabled:opacity-50"
            >
              {selectingAll ? "Selecting…" : `Select all ${total} matching filters`}
            </button>
          )}
          <select onChange={(e) => { bulkAssign(e.target.value); e.target.value = ""; }} className="rounded-lg border border-dark-border bg-dark px-2 py-1 text-white">
            <option value="">Assign to...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select onChange={(e) => { bulkStatus(e.target.value); e.target.value = ""; }} className="rounded-lg border border-dark-border bg-dark px-2 py-1 text-white">
            <option value="">Change status...</option>
            {AFFILIATE_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <AdminSkeleton rows={8} />
      ) : affiliates.length === 0 ? (
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-12 text-center">
          <p className="text-muted">No programs match your filters.</p>
          <button onClick={() => router.replace("/admin/affiliates")} className="mt-3 text-sm text-neon hover:underline">
            Clear all filters
          </button>
        </div>
      ) : view === "kanban" ? (
        <AdminAffiliateKanban
          programs={affiliates}
          onStatusChange={(id, status) => quickPatch(id, { status }, { silent: true })}
          canDragProgram={(p) => canEditAffiliateRow(user, p)}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-left text-muted">
                    <th className="w-8 px-3 py-3">
                      {isAdmin && (
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAllPage}
                          title="Select all on this page"
                        />
                      )}
                    </th>
                    <th className="px-3 py-3 font-medium">Company</th>
                    <th className="px-3 py-3 font-medium">Sign up</th>
                    <th className="px-3 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Commission</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((a) => {
                    const overdue = isFollowUpOverdue(a.nextFollowUpAt);
                    const dueSoon = isFollowUpDueThisWeek(a.nextFollowUpAt);
                    const pending = pendingEdits[a.id];
                    const displayStatus = pending?.status ?? a.status;
                    const displayAssignee = pending?.assignedToId ?? a.assignedToId ?? "";
                    const hasPending = rowHasPending(a, pending);
                    const canEdit = canEditAffiliateRow(user, a);
                    const signup = affiliateSignupUrl(a);
                    return (
                      <Fragment key={a.id}>
                      <tr className={`border-b border-dark-border/50 last:border-0 hover:bg-dark/50 ${overdue ? "bg-red-500/5" : dueSoon ? "bg-amber-500/5" : ""} ${hasPending ? "ring-1 ring-inset ring-neon/30" : ""}`}>
                        <td className="px-3 py-3">
                          <input type="checkbox" checked={selected.has(a.id)} onChange={() => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(a.id)) next.delete(a.id);
                              else next.add(a.id);
                              return next;
                            });
                          }} />
                        </td>
                        <td className="px-3 py-3">
                          <Link href={`/admin/affiliates/${a.id}`} className="font-medium text-white hover:text-neon">
                            {a.companyName}
                          </Link>
                        </td>
                        <td className="px-3 py-3">
                          {signup ? (
                            <a
                              href={signup}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex rounded-lg border border-neon/30 bg-neon/10 px-2.5 py-1 text-xs font-medium text-neon hover:bg-neon/20"
                            >
                              Sign up ↗
                            </a>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted">{a.category ?? "—"}</td>
                        <td className="px-3 py-3 text-muted">{a.commission ?? "—"}</td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          {canEdit ? (
                            <select
                              value={displayStatus}
                              onChange={(e) => setRowPending(a.id, { status: e.target.value })}
                              className={`rounded-lg border border-dark-border bg-dark px-2 py-1 text-xs ${statusColors[displayStatus]?.split(" ")[0] ?? ""}`}
                            >
                              {AFFILIATE_STATUSES.map((s) => (
                                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`text-xs ${statusColors[a.status]?.split(" ")[0] ?? "text-muted"}`}>
                              {a.status.replace(/_/g, " ")}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          {canEdit ? (
                            <select
                              value={displayAssignee}
                              onChange={(e) => setRowPending(a.id, { assignedToId: e.target.value || null })}
                              className="rounded-lg border border-dark-border bg-dark px-2 py-1 text-xs text-white"
                            >
                              <option value="">—</option>
                              {(isAdmin ? users : users.filter((u) => u.id === user.id)).map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-muted">
                              {a.assignedTo?.name ?? "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                      {hasPending && (
                        <tr key={`${a.id}-pending`} className="border-b border-dark-border/50 bg-neon/5">
                          <td colSpan={7} className="px-3 py-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-muted">Unsaved changes for {a.companyName}</span>
                              <button
                                type="button"
                                onClick={() => applyRowEdit(a)}
                                className="rounded-lg bg-neon px-2 py-1 font-medium text-ink"
                              >
                                Apply
                              </button>
                              <button
                                type="button"
                                onClick={() => clearPending(a.id)}
                                className="rounded-lg border border-dark-border px-2 py-1 text-muted hover:text-white"
                              >
                                Discard
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      </Fragment>
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
                onClick={() => updateParams({ page: String(page - 1) })}
                className="rounded-lg border border-dark-border px-3 py-1 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
                className="rounded-lg border border-dark-border px-3 py-1 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeCreateModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-dark-border bg-dark-elevated p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold">Add affiliate program</h2>
            <form onSubmit={handleCreate}>
              <AdminAffiliateForm form={createForm} onChange={setCreateForm} users={users} tools={tools} />
              {createError && <p className="mt-3 text-sm text-red-400">{createError}</p>}
              <div className="mt-6 flex gap-2">
                <button type="submit" className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-ink">Create</button>
                <button type="button" onClick={closeCreateModal} className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeImportModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-dark-border bg-dark-elevated p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold">Import programs</h2>
            <p className="mb-2 text-sm text-muted">
              Upload CSV or Excel (.xlsx), or paste CSV with: Company Name, Category, Commission, Recurring?, Cookie Duration, Signup URL, Notes
            </p>
            <input type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={handleFileUpload} className="mb-4 text-sm text-muted" />
            <textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setXlsxRows(null);
              }}
              disabled={!!xlsxRows}
              className="mb-4 h-40 w-full rounded-xl border border-dark-border bg-dark p-3 text-sm text-white focus:outline-none"
              placeholder="Company Name,Category,Commission,..."
            />
            {previewRows.length > 0 && (
              <div className="mb-4 rounded-xl border border-dark-border p-3 text-xs text-muted">
                <p className="mb-2 font-medium text-white">Preview ({previewRows.length} of {importTotal} rows)</p>
                {previewRows.map((r, i) => (
                  <p key={i}>{r.companyName} · {r.category ?? "—"} · {r.commission ?? "—"}</p>
                ))}
              </div>
            )}
            {importResult && <p className="mb-4 text-sm text-neon">{importResult}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                disabled={importing}
                className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                {importing ? "Importing…" : "Import"}
              </button>
              <button onClick={closeImportModal} className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

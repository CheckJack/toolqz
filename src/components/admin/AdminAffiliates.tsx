"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, MoreVertical, Pencil, Search } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AdminAffiliateForm,
  emptyForm,
  formToPayload,
  AffiliateFormData,
} from "@/components/admin/AdminAffiliateForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
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

type StatusTab = "ALL" | "ACTIVE" | "APPLIED" | "IN_PROGRESS" | "PENDING";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "APPLIED", label: "Applied" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "PENDING", label: "Pending" },
];

const OTHER_STATUSES = AFFILIATE_STATUSES.filter(
  (s) => !STATUS_TABS.some((tab) => tab.value === s)
);

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
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    ACTIVE: 0,
    APPLIED: 0,
    IN_PROGRESS: 0,
    PENDING: 0,
  });
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<AffiliateUser[]>([]);
  const [tools, setTools] = useState<
    { id: string; name: string; slug: string; published?: boolean; affiliate?: { id: string } | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
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
    setLoadError("");
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("sort")) params.set("sort", "updated");
    params.set("pageSize", String(PAGE_SIZE));

    try {
      const [aRes, uRes, tRes] = await Promise.all([
        fetch(`/api/admin/affiliates?${params}`),
        fetch("/api/admin/users"),
        fetch("/api/admin/tools?lite=true"),
      ]);

      if (aRes.ok) {
        const data = await aRes.json();
        setAffiliates(data.items ?? []);
        setTotal(data.total ?? 0);
        setTabCounts(
          data.counts ?? {
            all: data.total ?? 0,
            ACTIVE: 0,
            APPLIED: 0,
            IN_PROGRESS: 0,
            PENDING: 0,
          }
        );
        setApiCategories(data.categories ?? []);
        setPendingEdits({});
      } else {
        setLoadError("Could not load programs");
        toast("Failed to load programs", "error");
      }
      if (uRes.ok) setUsers(await uRes.json());
      if (tRes.ok) setTools(await tRes.json());
    } catch {
      setLoadError("Could not load programs");
      toast("Failed to load programs", "error");
    } finally {
      setLoading(false);
    }
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

  function setStatusTab(value: StatusTab) {
    updateParams({ status: value === "ALL" ? null : value, page: null });
  }

  function tabCount(value: StatusTab): number {
    if (value === "ALL") return tabCounts.all;
    return tabCounts[value] ?? 0;
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    router.replace("/admin/affiliates", { scroll: false });
  }

  function toggleFlag(
    key: "unassigned" | "mine" | "followups",
    on: boolean
  ) {
    if (key === "unassigned") {
      updateParams({
        unassigned: on ? "true" : null,
        ...(on ? { mine: null } : {}),
        page: null,
      });
      return;
    }
    if (key === "mine") {
      updateParams({
        mine: on ? "true" : null,
        ...(on ? { unassigned: null } : {}),
        page: null,
      });
      return;
    }
    updateParams({ followups: on ? "due" : null, page: null });
  }

  const statusTab =
    STATUS_TABS.some((tab) => tab.value === status) ? (status as StatusTab) : "ALL";
  const otherStatusSelected = status !== "ALL" && !STATUS_TABS.some((tab) => tab.value === status);

  const listLabel =
    statusTab === "ALL"
      ? ""
      : statusTab === "IN_PROGRESS"
        ? "in progress"
        : statusTab.toLowerCase();

  if (loading && affiliates.length === 0) return <AdminSkeleton rows={8} />;

  if (loadError && affiliates.length === 0) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-center text-red-400">
        {loadError}
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
        title="Affiliate CRM"
        description={`${total} ${listLabel ? `${listLabel} ` : ""}program${total === 1 ? "" : "s"}${view === "kanban" ? " · kanban view" : ""}`}
        action={
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowImport(true)}
                className="admin-toolbar-btn"
              >
                Import
              </button>
            )}
            <button
              type="button"
              onClick={() => exportCsv(selected.size ? [...selected] : undefined)}
              className="admin-toolbar-btn"
            >
              Export{selected.size ? ` (${selected.size})` : ""}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="admin-btn-primary"
            >
              Add program
            </button>
          </div>
        }
      />

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-dark-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="admin-segmented w-fit max-w-full overflow-x-auto">
              {STATUS_TABS.map((tab) => {
                const active = statusTab === tab.value && !otherStatusSelected;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusTab(tab.value)}
                    className={`admin-segmented-btn whitespace-nowrap ${active ? "admin-segmented-btn-active" : ""}`}
                  >
                    {tab.label}
                    <span className="ml-1.5 tabular-nums opacity-70">{tabCount(tab.value)}</span>
                  </button>
                );
              })}
            </div>
            <div className="admin-segmented w-fit">
              <button
                type="button"
                onClick={() => updateParams({ view: null, page: null })}
                className={`admin-segmented-btn ${view !== "kanban" ? "admin-segmented-btn-active" : ""}`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => updateParams({ view: "kanban", page: null })}
                className={`admin-segmented-btn ${view === "kanban" ? "admin-segmented-btn-active" : ""}`}
              >
                Kanban
              </button>
            </div>
          </div>

          <div className="relative min-w-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim"
              strokeWidth={1.75}
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search company…"
              className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              <select
                value={priority}
                onChange={(e) => updateParams({ priority: e.target.value || null, page: null })}
                className="min-w-[8.5rem] flex-1 rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white sm:flex-none"
              >
                <option value="">All priorities</option>
                {AFFILIATE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                value={category}
                onChange={(e) => updateParams({ category: e.target.value || null, page: null })}
                className="min-w-[9rem] flex-1 rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white sm:flex-none"
              >
                <option value="">All categories</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={assignee}
                onChange={(e) => updateParams({ assignedToId: e.target.value || null, page: null })}
                className="min-w-[9rem] flex-1 rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white sm:flex-none"
              >
                <option value="">All assignees</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <select
                value={hasTool}
                onChange={(e) => updateParams({ hasTool: e.target.value || null, page: null })}
                className="min-w-[9rem] flex-1 rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white sm:flex-none"
              >
                <option value="">All programs</option>
                <option value="true">Has linked tool</option>
                <option value="false">No linked tool</option>
              </select>
              <select
                value={otherStatusSelected ? status : ""}
                onChange={(e) => updateParams({ status: e.target.value || null, page: null })}
                className="min-w-[9rem] flex-1 rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white sm:flex-none"
              >
                <option value="">More statuses</option>
                {OTHER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="min-w-[9rem] flex-1 rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white sm:flex-none"
              >
                <option value="updated">Last updated</option>
                <option value="name">Company name</option>
                <option value="followup">Next follow-up</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toggleFlag("unassigned", !unassigned)}
              className={`admin-toolbar-btn ${unassigned ? "border-neon/40 text-neon" : ""}`}
            >
              Unassigned
            </button>
            <button
              type="button"
              onClick={() => toggleFlag("mine", !mine)}
              className={`admin-toolbar-btn ${mine ? "border-neon/40 text-neon" : ""}`}
            >
              My assignments
            </button>
            <button
              type="button"
              onClick={() => toggleFlag("followups", followups !== "due")}
              className={`admin-toolbar-btn ${followups === "due" ? "border-neon/40 text-neon" : ""}`}
            >
              Follow-ups due
            </button>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-dark-border/60 pt-3">
              {activeFilters.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => updateParams({ ...chip.clear, page: null })}
                  className="admin-toolbar-btn py-1 text-[11px]"
                >
                  {chip.label}
                  <span aria-hidden className="opacity-60">
                    ×
                  </span>
                </button>
              ))}
              <button type="button" onClick={clearFilters} className="admin-link-accent text-xs">
                Clear all
              </button>
            </div>
          )}
        </div>

        {selected.size > 0 && isAdmin && (
          <div className="flex flex-wrap items-center gap-2 border-b border-neon/20 bg-neon/5 px-4 py-3 text-sm sm:px-5">
            <span className="text-white">
              {selected.size} selected{bulkWorking ? " · updating…" : ""}
            </span>
            {total > affiliates.length && !allMatchingSelected && (
              <button
                type="button"
                onClick={selectAllMatching}
                disabled={selectingAll}
                className="admin-link-accent disabled:opacity-50"
              >
                {selectingAll ? "Selecting…" : `Select all ${total} matching`}
              </button>
            )}
            <select
              onChange={(e) => {
                bulkAssign(e.target.value);
                e.target.value = "";
              }}
              className="rounded-lg border border-dark-border bg-dark px-2 py-1.5 text-sm text-white"
            >
              <option value="">Assign to…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <select
              onChange={(e) => {
                bulkStatus(e.target.value);
                e.target.value = "";
              }}
              className="rounded-lg border border-dark-border bg-dark px-2 py-1.5 text-sm text-white"
            >
              <option value="">Change status…</option>
              {AFFILIATE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="p-4 sm:p-5">
            <AdminSkeleton rows={6} />
          </div>
        ) : affiliates.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-5">
            <p className="text-sm text-muted">No programs match your filters.</p>
            {(search ||
              status !== "ALL" ||
              priority ||
              category ||
              assignee ||
              hasTool ||
              unassigned ||
              mine ||
              followups) && (
              <button type="button" onClick={clearFilters} className="admin-link-accent mt-3">
                Clear filters
              </button>
            )}
          </div>
        ) : view === "kanban" ? (
          <div className="p-4 sm:p-5">
            <AdminAffiliateKanban
              programs={affiliates}
              onStatusChange={(id, status) => quickPatch(id, { status }, { silent: true })}
              canDragProgram={(p) => canEditAffiliateRow(user, p)}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[760px]">
                <thead>
                  <tr>
                    {isAdmin && (
                      <th className="w-10">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAllPage}
                          title="Select all on this page"
                          aria-label="Select all on this page"
                        />
                      </th>
                    )}
                    <th>Company</th>
                    <th className="hidden md:table-cell">Category</th>
                    <th className="hidden lg:table-cell">Commission</th>
                    <th>Status</th>
                    <th className="hidden sm:table-cell">Assignee</th>
                    <th className="w-12" aria-label="Actions" />
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
                        <tr
                          className={`${overdue ? "bg-red-500/5" : dueSoon ? "bg-amber-500/5" : ""} ${hasPending ? "ring-1 ring-inset ring-neon/30" : ""}`}
                        >
                          {isAdmin && (
                            <td>
                              <input
                                type="checkbox"
                                checked={selected.has(a.id)}
                                onChange={() => {
                                  setSelected((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(a.id)) next.delete(a.id);
                                    else next.add(a.id);
                                    return next;
                                  });
                                }}
                                aria-label={`Select ${a.companyName}`}
                              />
                            </td>
                          )}
                          <td className="min-w-[12rem]">
                            <Link
                              href={`/admin/affiliates/${a.id}`}
                              className="block font-medium text-white hover:text-neon"
                            >
                              {a.companyName}
                            </Link>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
                              {a.priority && a.priority !== "MEDIUM" && (
                                <span className="text-muted-dim">{a.priority}</span>
                              )}
                              {a.tool && (
                                <Link
                                  href={`/admin/tools/${a.tool.id}`}
                                  className="text-neon/80 hover:text-neon"
                                >
                                  {a.tool.name}
                                </Link>
                              )}
                              {overdue && <span className="text-red-400">Follow-up overdue</span>}
                              {!overdue && dueSoon && (
                                <span className="text-amber-400">Follow-up due</span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-muted md:hidden">
                              {a.category ?? "—"}
                              {a.commission ? ` · ${a.commission}` : ""}
                            </p>
                          </td>
                          <td className="hidden text-muted md:table-cell">{a.category ?? "—"}</td>
                          <td className="hidden text-muted lg:table-cell">{a.commission ?? "—"}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {canEdit ? (
                              <select
                                value={displayStatus}
                                onChange={(e) => setRowPending(a.id, { status: e.target.value })}
                                className={`max-w-[8.5rem] rounded-lg border border-dark-border bg-dark px-2 py-1 text-xs text-white ${statusColors[displayStatus]?.split(" ")[0] ?? ""}`}
                              >
                                {AFFILIATE_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s.replace(/_/g, " ")}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${statusColors[a.status] ?? "text-muted bg-dark-border"}`}
                              >
                                {a.status.replace(/_/g, " ")}
                              </span>
                            )}
                          </td>
                          <td className="hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                            {canEdit ? (
                              <select
                                value={displayAssignee}
                                onChange={(e) =>
                                  setRowPending(a.id, { assignedToId: e.target.value || null })
                                }
                                className="max-w-[9rem] rounded-lg border border-dark-border bg-dark px-2 py-1 text-xs text-white"
                              >
                                <option value="">—</option>
                                {(isAdmin ? users : users.filter((u) => u.id === user.id)).map(
                                  (u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name}
                                    </option>
                                  )
                                )}
                              </select>
                            ) : (
                              <span className="text-muted">{a.assignedTo?.name ?? "—"}</span>
                            )}
                          </td>
                          <td className="w-12 text-right">
                            <AffiliateRowActions program={a} signupUrl={signup} />
                          </td>
                        </tr>
                        {hasPending && (
                          <tr className="bg-neon/5">
                            <td colSpan={isAdmin ? 7 : 6} className="px-4 py-2 sm:px-5">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-muted">
                                  Unsaved changes for {a.companyName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => applyRowEdit(a)}
                                  className="admin-btn-primary px-2.5 py-1 text-[11px]"
                                >
                                  Apply
                                </button>
                                <button
                                  type="button"
                                  onClick={() => clearPending(a.id)}
                                  className="admin-toolbar-btn py-1 text-[11px]"
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

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-border px-4 py-3 text-sm text-muted sm:px-5">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => updateParams({ page: String(page - 1) })}
                    className="admin-toolbar-btn disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => updateParams({ page: String(page + 1) })}
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

function AffiliateRowActions({
  program,
  signupUrl,
}: {
  program: AffiliateProgram;
  signupUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="admin-icon-btn h-8 w-8"
        aria-label={`Actions for ${program.companyName}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>

      {open && (
        <div
          role="menu"
          className="admin-menu absolute right-0 top-full z-30 mt-1 min-w-[10.5rem] py-1"
        >
          <Link
            href={`/admin/affiliates/${program.id}`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="admin-menu-item"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Edit program
          </Link>
          {program.tool && (
            <Link
              href={`/admin/tools/${program.tool.id}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="admin-menu-item"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              View linked tool
            </Link>
          )}
          {signupUrl && (
            <a
              href={signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="admin-menu-item"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              Sign up page
            </a>
          )}
        </div>
      )}
    </div>
  );
}

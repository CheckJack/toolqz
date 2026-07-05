"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ExternalLink,
  LayoutGrid,
  Link2,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";
import { AFFILIATE_CATEGORIES } from "@/constants/affiliate-categories";
import { AffiliateProgram } from "@/types/affiliate";

type FilterTab = "all" | "missing-portal";

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All active" },
  { value: "missing-portal", label: "Missing dashboard link" },
];

interface DirectoryForm {
  companyName: string;
  affiliateNetwork: string;
  portalUrl: string;
  affiliateUrl: string;
  website: string;
  category: string;
  commission: string;
  notes: string;
}

const emptyDirectoryForm: DirectoryForm = {
  companyName: "",
  affiliateNetwork: "",
  portalUrl: "",
  affiliateUrl: "",
  website: "",
  category: "",
  commission: "",
  notes: "",
};

const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none";

function programToForm(program: AffiliateProgram): DirectoryForm {
  return {
    companyName: program.companyName,
    affiliateNetwork: program.affiliateNetwork ?? "",
    portalUrl: program.portalUrl ?? "",
    affiliateUrl: program.affiliateUrl ?? "",
    website: program.website ?? "",
    category: program.category ?? "",
    commission: program.commission ?? "",
    notes: program.notes ?? "",
  };
}

function ListLink({
  href,
  label,
}: {
  href: string | null | undefined;
  label: string;
}) {
  if (!href?.trim()) {
    return <span className="text-[12px] text-muted-dim">—</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="admin-link-accent inline-flex items-center gap-1 text-[12px]"
    >
      {label}
      <ExternalLink className="h-3 w-3 shrink-0 opacity-70" strokeWidth={1.75} />
    </a>
  );
}

function DirectoryRowActions({
  program,
  onEdit,
}: {
  program: AffiliateProgram;
  onEdit: (program: AffiliateProgram) => void;
}) {
  return (
    <AdminRowActionsMenu label={`Actions for ${program.companyName}`}>
      {(close) => (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onEdit(program);
            }}
            className="admin-menu-item w-full"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Edit links
          </button>
          <Link
            href={`/admin/affiliates/${program.id}`}
            role="menuitem"
            onClick={close}
            className="admin-menu-item"
          >
            <LayoutGrid className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
            Open in CRM
          </Link>
          {program.tool && (
            <Link
              href={`/admin/tools/${program.tool.id}`}
              role="menuitem"
              onClick={close}
              className="admin-menu-item"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              View linked tool
            </Link>
          )}
          {program.portalUrl && (
            <a
              href={program.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={close}
              className="admin-menu-item"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              Open dashboard
            </a>
          )}
        </>
      )}
    </AdminRowActionsMenu>
  );
}

export function AdminAffiliateDirectory() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [filter, setFilter] = useState<FilterTab>(
    (searchParams.get("filter") as FilterTab) || "all"
  );
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DirectoryForm>(emptyDirectoryForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const params = new URLSearchParams();
    params.set("pageSize", "200");
    params.set("sort", "name");
    params.set("status", "ACTIVE");
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/affiliates?${params}`);
      if (!res.ok) {
        setLoadError("Could not load affiliate programs");
        toast("Failed to load programs", "error");
        return;
      }
      const data = await res.json();
      setPrograms(data.items ?? []);
    } catch {
      setLoadError("Could not load affiliate programs");
      toast("Failed to load programs", "error");
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (filter === "missing-portal") {
      return programs.filter((program) => !program.portalUrl?.trim());
    }
    return programs;
  }, [programs, filter]);

  const missingPortalCount = useMemo(
    () => programs.filter((p) => !p.portalUrl?.trim()).length,
    [programs]
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyDirectoryForm);
    setShowModal(true);
  }

  function openEdit(program: AffiliateProgram) {
    setEditingId(program.id);
    setForm(programToForm(program));
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyDirectoryForm);
  }

  async function saveProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyName.trim()) {
      toast("Company name is required", "error");
      return;
    }

    setSaving(true);
    const payload = {
      companyName: form.companyName.trim(),
      affiliateNetwork: form.affiliateNetwork.trim() || null,
      portalUrl: form.portalUrl.trim() || null,
      affiliateUrl: form.affiliateUrl.trim() || null,
      website: form.website.trim() || null,
      category: form.category.trim() || null,
      commission: form.commission.trim() || null,
      notes: form.notes.trim() || null,
      status: editingId ? undefined : "ACTIVE",
    };

    try {
      const res = await fetch(
        editingId ? `/api/admin/affiliates/${editingId}` : "/api/admin/affiliates",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "Save failed", "error");
        return;
      }

      toast(editingId ? "Program updated" : "Program added to directory");
      closeModal();
      load();
    } catch {
      toast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Affiliate directory"
        description="Active affiliate partnerships only — bookmark dashboard logins and tracking links. Set a program to Active in CRM to list it here."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/affiliates"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-dark-border px-3 py-2 text-[13px] text-muted transition-colors hover:text-white"
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
              Open CRM
            </Link>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-neon px-4 py-2 text-[13px] font-semibold text-ink"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add program
            </button>
          </div>
        }
      />

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-dark-border p-4 sm:p-5">
          <div className="relative min-w-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by company, network, or notes…"
              className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
            />
          </div>

          <div className="admin-segmented-tabs flex flex-wrap gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={filter === tab.value ? "admin-segmented-tab is-active" : "admin-segmented-tab"}
              >
                {tab.label}
                {tab.value === "missing-portal" && missingPortalCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                    {missingPortalCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

      {loading ? (
        <div className="p-4 sm:p-5">
          <AdminSkeleton rows={6} />
        </div>
      ) : loadError ? (
        <div className="p-8 text-center">
          <p className="text-red-400">{loadError}</p>
          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-lg border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <Link2 className="mb-3 h-8 w-8 text-muted-dim" strokeWidth={1.5} />
          <p className="text-[15px] font-medium text-white">No active affiliate programs</p>
          <p className="mt-2 max-w-md text-[13px] text-muted">
            Only programs with <strong className="font-medium text-white">Active</strong> status in CRM appear here. Apply and approve partners in Affiliate CRM first.
          </p>
          <Link
            href="/admin/affiliates"
            className="mt-5 inline-flex rounded-lg bg-neon px-4 py-2 text-[13px] font-semibold text-ink"
          >
            Open CRM
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[56rem]">
            <thead>
              <tr>
                <th>Program</th>
                <th className="hidden md:table-cell">Network</th>
                <th>Dashboard</th>
                <th className="hidden lg:table-cell">Tracking</th>
                <th className="hidden xl:table-cell">Website</th>
                <th className="w-12" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((program) => {
                const portal = program.portalUrl?.trim();
                const tracking = program.affiliateUrl?.trim();
                const website = program.website?.trim();

                return (
                  <tr key={program.id}>
                    <td className="min-w-[10rem]">
                      <p className="font-medium text-white">{program.companyName}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-dim">
                        {[program.category, program.commission].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {program.tool && (
                        <Link
                          href={`/tools/${program.tool.slug}`}
                          target="_blank"
                          className="mt-1 inline-block text-[11px] text-muted hover:text-neon"
                        >
                          Live: {program.tool.name}
                        </Link>
                      )}
                    </td>
                    <td className="hidden text-[13px] text-muted md:table-cell">
                      {program.affiliateNetwork || "—"}
                    </td>
                    <td>
                      {portal ? (
                        <ListLink href={portal} label="Open" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEdit(program)}
                          className="text-[12px] text-amber-300 hover:underline"
                        >
                          Add link
                        </button>
                      )}
                    </td>
                    <td className="hidden lg:table-cell">
                      <ListLink href={tracking} label="Tracking" />
                    </td>
                    <td className="hidden xl:table-cell">
                      <ListLink href={website} label="Site" />
                    </td>
                    <td className="w-12 text-right">
                      <DirectoryRowActions program={program} onEdit={openEdit} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="affiliate-directory-modal-title"
        >
          <div className="admin-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6">
            <h2 id="affiliate-directory-modal-title" className="text-lg font-medium text-white">
              {editingId ? "Edit affiliate links" : "Add affiliate program"}
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              Save the login URL for each partner portal so you can open accounts without searching.
            </p>

            <form onSubmit={saveProgram} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-[12px] text-muted">Company name *</label>
                <input
                  className={inputClass}
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] text-muted">Affiliate network</label>
                  <input
                    className={inputClass}
                    value={form.affiliateNetwork}
                    onChange={(e) => setForm((f) => ({ ...f, affiliateNetwork: e.target.value }))}
                    placeholder="Impact, ShareASale…"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] text-muted">Category</label>
                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {AFFILIATE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] text-muted">Affiliate dashboard URL</label>
                <input
                  className={inputClass}
                  type="url"
                  value={form.portalUrl}
                  onChange={(e) => setForm((f) => ({ ...f, portalUrl: e.target.value }))}
                  placeholder="https://affiliates.partner.com/login"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] text-muted">Tracking link (for TOOLQZ)</label>
                <input
                  className={inputClass}
                  type="url"
                  value={form.affiliateUrl}
                  onChange={(e) => setForm((f) => ({ ...f, affiliateUrl: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] text-muted">Website</label>
                  <input
                    className={inputClass}
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] text-muted">Commission</label>
                  <input
                    className={inputClass}
                    value={form.commission}
                    onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))}
                    placeholder="30% recurring"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] text-muted">Notes</label>
                <textarea
                  className={`${inputClass} min-h-20`}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Login email, payout schedule, account manager…"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-dark-border px-4 py-2 text-[13px] text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-neon px-4 py-2 text-[13px] font-semibold text-ink disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingId ? "Save links" : "Add program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

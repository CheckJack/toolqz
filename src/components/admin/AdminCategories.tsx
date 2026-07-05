"use client";

import Link from "next/link";
import { MoreVertical, Pencil, Search, Trash2, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";
import { categorySlugify } from "@/lib/categories";

interface CategoryRow {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  sortOrder: number;
  published: boolean;
  toolCount: number;
}

const emptyForm = {
  label: "",
  slug: "",
  description: "",
  sortOrder: "0",
  published: true,
};

type VisibilityTab = "" | "published" | "hidden";

const VISIBILITY_TABS: { value: VisibilityTab; label: string }[] = [
  { value: "", label: "All" },
  { value: "published", label: "Visible" },
  { value: "hidden", label: "Hidden" },
];

export function AdminCategories() {
  const { toast } = useToast();
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [writable, setWritable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityTab>("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setItems(data.items ?? []);
        setWritable(data.writable !== false);
      })
      .catch(() => toast("Failed to load categories", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const tabCounts = useMemo(
    () => ({
      all: items.length,
      published: items.filter((item) => item.published).length,
      hidden: items.filter((item) => !item.published).length,
    }),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    return items.filter((item) => {
      if (visibilityFilter === "published" && !item.published) return false;
      if (visibilityFilter === "hidden" && item.published) return false;
      if (!query) return true;
      return (
        item.label.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        (item.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [items, searchInput, visibilityFilter]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSlugTouched(false);
    setShowForm(false);
  }

  function startAdd() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(category: CategoryRow) {
    setEditingId(category.id);
    setShowForm(true);
    setForm({
      label: category.label,
      slug: category.slug,
      description: category.description ?? "",
      sortOrder: String(category.sortOrder),
      published: category.published,
    });
    setSlugTouched(true);
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    const label = form.label.trim();
    const slug = categorySlugify(form.slug || label);
    if (!label || !slug) {
      toast("Label is required", "error");
      return;
    }

    setSaving(true);
    const payload = {
      label,
      slug,
      description: form.description.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      published: form.published,
    };

    try {
      const res = await fetch(
        editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      toast(editingId ? "Category updated" : "Category created");
      resetForm();
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(category: CategoryRow) {
    if (
      !confirm(
        `Delete "${category.label}"? This cannot be undone if tools are assigned to it.`
      )
    ) {
      return;
    }

    const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(data.error ?? "Delete failed", "error");
      return;
    }

    toast("Category deleted");
    if (editingId === category.id) resetForm();
    load();
  }

  if (loading) return <AdminSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Tool categories"
        description={`${items.length} categor${items.length === 1 ? "y" : "ies"} for homepage filters and tool listings`}
        action={
          writable ? (
            <button type="button" onClick={startAdd} className="admin-btn-primary">
              Add category
            </button>
          ) : undefined
        }
      />

      {!writable && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Categories are read-only until the database is updated. On the server, run{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 text-xs">npm run db:migrate</code> against
          your production database, then redeploy if needed.
        </div>
      )}

      {showForm && writable && (
        <form onSubmit={(e) => void saveCategory(e)} className="admin-card admin-card-pad space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="admin-section-title">
              {editingId ? "Edit category" : "New category"}
            </h2>
            <button type="button" onClick={resetForm} className="admin-toolbar-btn">
              Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-muted">Label *</label>
              <input
                className="w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/40 focus:outline-none"
                value={form.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    label,
                    slug: slugTouched ? prev.slug : categorySlugify(label),
                  }));
                }}
                placeholder="e.g. Productivity"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted">Slug *</label>
              <input
                className="w-full rounded-lg border border-dark-border bg-dark px-3 py-2 font-mono text-sm text-white focus:border-neon/40 focus:outline-none"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="productivity"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-muted">Description (optional)</label>
              <input
                className="w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/40 focus:outline-none"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Internal note — not shown on the homepage yet"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted">Sort order</label>
              <input
                type="number"
                className="w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/40 focus:outline-none"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
                />
                Show on homepage filter
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="admin-btn-primary disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Create category"}
          </button>
        </form>
      )}

      <div className="admin-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-dark-border p-4 sm:p-5">
          <div className="admin-segmented w-fit max-w-full overflow-x-auto">
            {VISIBILITY_TABS.map((tab) => {
              const active = visibilityFilter === tab.value;
              const count =
                tab.value === "published"
                  ? tabCounts.published
                  : tab.value === "hidden"
                    ? tabCounts.hidden
                    : tabCounts.all;

              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setVisibilityFilter(tab.value)}
                  className={`admin-segmented-btn whitespace-nowrap ${active ? "admin-segmented-btn-active" : ""}`}
                >
                  {tab.label}
                  <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
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
              placeholder="Search categories…"
              className="w-full rounded-lg border border-dark-border bg-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
            />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-4 py-16 text-center sm:px-5">
            <p className="text-sm text-muted">
              {items.length === 0
                ? "No categories yet."
                : "No categories match your filters."}
            </p>
            {items.length === 0 && writable ? (
              <button type="button" onClick={startAdd} className="admin-link-accent mt-3">
                Add your first category
              </button>
            ) : searchInput || visibilityFilter ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setVisibilityFilter("");
                }}
                className="admin-link-accent mt-3"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="text-right">Tools</th>
                  <th className="hidden text-right sm:table-cell">Order</th>
                  <th>Visible</th>
                  <th className="w-12" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((category) => (
                  <tr key={category.id}>
                    <td className="min-w-[12rem]">
                      <p className="font-medium text-white">{category.label}</p>
                      <p className="font-mono text-[11px] text-muted-dim">/{category.slug}</p>
                      {category.description && (
                        <p className="mt-1 line-clamp-1 text-[11px] text-muted">
                          {category.description}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted sm:hidden">
                        Order {category.sortOrder}
                      </p>
                    </td>
                    <td className="text-right">
                      {category.toolCount > 0 ? (
                        <Link
                          href={`/admin/tools?category=${encodeURIComponent(category.slug)}`}
                          className="font-medium tabular-nums text-neon hover:underline"
                        >
                          {category.toolCount}
                        </Link>
                      ) : (
                        <span className="tabular-nums text-muted">0</span>
                      )}
                    </td>
                    <td className="hidden text-right tabular-nums text-muted sm:table-cell">
                      {category.sortOrder}
                    </td>
                    <td>
                      <span
                        className={`admin-toggle ${category.published ? "admin-toggle-on-emerald" : ""}`}
                      >
                        {category.published ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="w-12 text-right">
                      <CategoryRowActions
                        category={category}
                        writable={writable}
                        onEdit={() => startEdit(category)}
                        onDelete={() => void removeCategory(category)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryRowActions({
  category,
  writable,
  onEdit,
  onDelete,
}: {
  category: CategoryRow;
  writable: boolean;
  onEdit: () => void;
  onDelete: () => void;
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
        aria-label={`Actions for ${category.label}`}
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
          {writable && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="admin-menu-item w-full text-left"
            >
              <Pencil className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              Edit category
            </button>
          )}
          {category.toolCount > 0 && (
            <Link
              href={`/admin/tools?category=${encodeURIComponent(category.slug)}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="admin-menu-item"
            >
              <Wrench className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              View tools
            </Link>
          )}
          {writable && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="admin-menu-item w-full text-left text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

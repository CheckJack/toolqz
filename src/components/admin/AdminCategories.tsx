"use client";

import { useCallback, useEffect, useState } from "react";
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

export function AdminCategories() {
  const { toast } = useToast();
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [writable, setWritable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

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

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSlugTouched(false);
  }

  function startEdit(category: CategoryRow) {
    setEditingId(category.id);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tool categories</h1>
        <p className="text-muted">
          Create and manage categories used on the homepage filter and tool listings.
        </p>
      </div>

      {!writable && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Categories are read-only until the database is updated. On the server, run{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 text-xs">npm run db:migrate</code> against
          your production database, then redeploy if needed.
        </div>
      )}

      <form
        onSubmit={(e) => void saveCategory(e)}
        className="space-y-4 rounded-2xl border border-dark-border bg-dark-elevated p-6"
      >
        <h2 className="font-semibold">{editingId ? "Edit category" : "Add category"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Label *</label>
            <input
              className="w-full rounded-xl border border-dark-border bg-dark px-3 py-2 text-white"
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
            <label className="mb-1 block text-sm text-muted">Slug *</label>
            <input
              className="w-full rounded-xl border border-dark-border bg-dark px-3 py-2 font-mono text-white"
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
            <label className="mb-1 block text-sm text-muted">Description (optional)</label>
            <input
              className="w-full rounded-xl border border-dark-border bg-dark px-3 py-2 text-white"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Shown internally only for now"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Sort order</label>
            <input
              type="number"
              className="w-full rounded-xl border border-dark-border bg-dark px-3 py-2 text-white"
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
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving || !writable}
            className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-dark disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Create category"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-dark-border px-4 py-2 text-sm text-muted hover:text-white"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border text-left text-muted">
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Tools</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Visible</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No categories yet. Create one above.
                </td>
              </tr>
            ) : (
              items.map((category) => (
                <tr key={category.id} className="border-b border-dark-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium">{category.label}</td>
                  <td className="px-4 py-3 font-mono text-muted">{category.slug}</td>
                  <td className="px-4 py-3 text-muted">{category.toolCount}</td>
                  <td className="px-4 py-3 text-muted">{category.sortOrder}</td>
                  <td className="px-4 py-3">
                    {category.published ? (
                      <span className="text-neon">Yes</span>
                    ) : (
                      <span className="text-muted">Hidden</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      className="mr-3 text-neon hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeCategory(category)}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import { AdminSlugRedirects } from "@/components/admin/AdminSlugRedirects";
import {
  AdminToolForm,
  emptyToolForm,
  formToToolPayload,
  toolToForm,
  ToolFormData,
} from "@/components/admin/AdminToolForm";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";
import { confirmDiscardChanges, useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { SessionUser } from "@/lib/auth";
import type { AdminTool } from "@/lib/tool-payload";
import { slugify } from "@/lib/tool-payload";

export function AdminToolEditor({ id, user }: { id: string; user: SessionUser }) {
  const isNew = id === "new";
  const isAdmin = user.role === "ADMIN";
  const router = useRouter();
  const { toast } = useToast();
  const [tool, setTool] = useState<AdminTool | null>(null);
  const [form, setForm] = useState<ToolFormData>(emptyToolForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");

  const isDirty = useMemo(() => {
    if (isNew) {
      return (
        form.name.trim() !== "" ||
        form.description.trim() !== "" ||
        form.url.trim() !== ""
      );
    }
    return savedSnapshot !== "" && JSON.stringify(form) !== savedSnapshot;
  }, [form, isNew, savedSnapshot]);

  useUnsavedChanges(isDirty);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/tools/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: AdminTool) => {
        setTool(data);
        const nextForm = toolToForm(data);
        setForm(nextForm);
        setSavedSnapshot(JSON.stringify(nextForm));
        setOriginalSlug(data.slug);
      })
      .catch(() => setError("Tool not found"));
  }, [id, isNew]);

  useEffect(() => {
    if (isNew && form.name && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(f.name) }));
    }
  }, [form.name, form.slug, isNew]);

  async function save() {
    setSaving(true);
    setError("");
    const payload = formToToolPayload(form);

    const res = await fetch(isNew ? "/api/admin/tools" : `/api/admin/tools/${id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to save");
      toast(data.error ?? "Failed to save", "error");
      setSaving(false);
      return;
    }

    toast(isNew ? "Tool created" : "Tool saved");
    if (isNew) {
      router.push(`/admin/tools/${data.id}`);
    } else {
      setTool(data);
      const nextForm = toolToForm(data);
      setForm(nextForm);
      setSavedSnapshot(JSON.stringify(nextForm));
      setOriginalSlug(data.slug);
    }
    setSaving(false);
  }

  async function remove() {
    if (!tool) return;
    const linked = tool.affiliate ? ` Linked CRM record: ${tool.affiliate.companyName}.` : "";
    if (!confirm(`Delete "${tool.name}"?${linked} This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/tools/${tool.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Tool deleted");
      router.push("/admin/tools");
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error === "Forbidden" ? "Only admins can delete tools" : "Failed to delete tool", "error");
    }
  }


  if (!isNew && !tool && !error) {
    return <AdminSkeleton rows={6} />;
  }

  if (error && !isNew) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <Link href="/admin/tools" className="mt-4 inline-block text-sm text-neon hover:underline">
          Back to tools
        </Link>
      </div>
    );
  }

  const clicks = tool?._count?.clicks ?? 0;

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: "Tools", href: "/admin/tools" },
          { label: isNew ? "New tool" : tool?.name ?? "Edit" },
        ]}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isNew ? "New tool" : tool?.name}</h1>
          {!isNew && tool && (
            <p className="mt-1 text-sm text-muted">/tools/{tool.slug}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && tool && (
            <>
              <Link
                href={`/tools/${tool.slug}`}
                target="_blank"
                className={`rounded-lg border border-dark-border px-3 py-2 text-sm ${
                  tool.published ? "text-muted hover:text-neon" : "text-muted/50 cursor-not-allowed pointer-events-none"
                }`}
                aria-disabled={!tool.published}
                title={tool.published ? "Open public page" : "Publish tool to preview on site"}
              >
                {tool.published ? "Preview ↗" : "Preview (draft)"}
              </Link>
              {tool.affiliate && (
                <Link
                  href={`/admin/affiliates/${tool.affiliate.id}`}
                  className="rounded-lg border border-dark-border px-3 py-2 text-sm text-muted hover:text-neon"
                >
                  CRM: {tool.affiliate.status.replace(/_/g, " ")}
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {!isNew && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href={tool ? `/admin/analytics?tool=${encodeURIComponent(tool.slug)}` : "/admin/analytics"}
            className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm transition hover:border-neon/30"
          >
            <p className="text-muted">Total clicks</p>
            <p className="text-2xl font-bold text-neon">{clicks}</p>
            <p className="mt-1 text-xs text-neon">View in analytics →</p>
          </Link>
          <div className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm">
            <p className="text-muted">Status</p>
            <p className="font-semibold">{tool?.published ? "Published" : "Draft"}</p>
          </div>
          <div className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm">
            <p className="text-muted">Affiliate tracking</p>
            <p className="font-semibold">{tool?.affiliateUrl ? "Active" : "None"}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
        <AdminToolForm
          form={form}
          onChange={setForm}
          isNew={isNew}
          isAdmin={isAdmin}
          originalSlug={originalSlug}
          linkedAffiliate={tool?.affiliate ?? null}
        />
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {isDirty && <p className="mt-3 text-xs text-amber-400">You have unsaved changes</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-ink hover:bg-neon-dim disabled:opacity-50"
          >
            {saving ? "Saving..." : isNew ? "Create tool" : "Save changes"}
          </button>
          <Link href="/admin/tools" className="rounded-xl border border-dark-border px-5 py-2.5 text-sm text-muted" onClick={(e) => { if (!confirmDiscardChanges(isDirty)) e.preventDefault(); }}>
            Cancel
          </Link>
          {!isNew && isAdmin && (
            <button type="button" onClick={remove} className="rounded-xl border border-red-500/30 px-5 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
              Delete tool
            </button>
          )}
        </div>
        </form>
        {!isNew && isAdmin && tool && <AdminSlugRedirects toolId={tool.id} />}
      </div>
    </div>
  );
}

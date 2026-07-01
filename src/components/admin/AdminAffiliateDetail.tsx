"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AdminAffiliateForm,
  affiliateToForm,
  emptyForm,
  formToPayload,
  AffiliateFormData,
} from "@/components/admin/AdminAffiliateForm";
import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";
import { confirmDiscardChanges, useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { SessionUser } from "@/lib/auth";
import {
  AffiliateActivity,
  AffiliateProgram,
  AffiliateUser,
} from "@/types/affiliate";
import { isFollowUpOverdue } from "@/lib/affiliates";

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

export function AdminAffiliateDetail({ id, user }: { id: string; user: SessionUser }) {
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = user.role === "ADMIN";
  const [affiliate, setAffiliate] = useState<AffiliateProgram | null>(null);
  const [form, setForm] = useState<AffiliateFormData>(emptyForm);
  const [users, setUsers] = useState<AffiliateUser[]>([]);
  const [tools, setTools] = useState<
    { id: string; name: string; slug: string; published?: boolean; affiliate?: { id: string } | null }[]
  >([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingTool, setCreatingTool] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const isDirty = useMemo(
    () => savedSnapshot !== "" && JSON.stringify(form) !== savedSnapshot,
    [form, savedSnapshot]
  );

  useUnsavedChanges(isDirty);

  async function load() {
    const [aRes, uRes, tRes] = await Promise.all([
      fetch(`/api/admin/affiliates/${id}`),
      fetch("/api/admin/users"),
      fetch("/api/admin/tools?lite=true"),
    ]);
    if (aRes.ok) {
      const data = await aRes.json();
      setAffiliate(data);
      const nextForm = affiliateToForm(data);
      setForm(nextForm);
      setSavedSnapshot(JSON.stringify(nextForm));
      setLoadError("");
    } else if (aRes.status === 404) {
      setLoadError("Program not found");
      setAffiliate(null);
    } else {
      setLoadError("Failed to load program");
      setAffiliate(null);
    }
    if (uRes.ok) setUsers(await uRes.json());
    if (tRes.ok) setTools(await tRes.json());
  }

  useEffect(() => {
    load();
  }, [id]);

  async function save() {
    setSaving(true);
    const payload = formToPayload(form);
    if (payload.status === "ACTIVE" && !payload.affiliateUrl) {
      if (
        !confirm(
          "Save as ACTIVE without an affiliate tracking URL? The linked tool will not earn tracked clicks."
        )
      ) {
        setSaving(false);
        return;
      }
    }
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setAffiliate(data);
      const nextForm = affiliateToForm(data);
      setForm(nextForm);
      setSavedSnapshot(JSON.stringify(nextForm));
      if (payload.status === "ACTIVE" && payload.affiliateUrl && data.tool) {
        toast(`Affiliate URL synced to ${data.tool.name}`);
      } else {
        toast("Program saved");
      }
    } else {
      toast("Failed to save", "error");
    }
    setSaving(false);
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    const res = await fetch(`/api/admin/affiliates/${id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", content: note }),
    });
    if (res.ok) {
      setNote("");
      toast("Note added");
      load();
    }
  }

  async function quickAction(action: string, followUpDays?: number) {
    const today = new Date().toISOString().slice(0, 10);
    const payload: Record<string, string> = {};
    let activityContent = "";

    if (action === "contacted") {
      payload.contactedAt = today;
      if (affiliate && ["PENDING"].includes(affiliate.status)) {
        payload.status = "IN_PROGRESS";
      }
      activityContent = affiliate?.status === "PENDING"
        ? "Marked as contacted — status set to In Progress"
        : "Marked as contacted";
    }
    if (action === "followup" && followUpDays) {
      const d = new Date();
      d.setDate(d.getDate() + followUpDays);
      payload.nextFollowUpAt = d.toISOString().slice(0, 10);
      activityContent = `Follow-up scheduled for ${d.toLocaleDateString()} (${followUpDays}d)`;
    }

    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok && activityContent) {
      await fetch(`/api/admin/affiliates/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "note", content: activityContent }),
      });
      toast(activityContent);
      load();
    }
  }

  async function createToolFromAffiliate() {
    setCreatingTool(true);
    const res = await fetch("/api/admin/tools/from-affiliate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affiliateId: id }),
    });
    const data = await res.json();
    if (res.ok) {
      toast(`Tool created — complete content before publishing`);
      router.push(`/admin/tools/${data.id}`);
    } else {
      toast(data.error ?? "Failed to create tool", "error");
    }
    setCreatingTool(false);
  }

  async function remove() {
    if (!affiliate || !confirm(`Delete "${affiliate.companyName}" from CRM?`)) return;
    const res = await fetch(`/api/admin/affiliates/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Program deleted");
      router.push("/admin/affiliates");
    } else {
      const data = await res.json().catch(() => ({}));
      toast(data.error === "Forbidden" ? "Only admins can delete programs" : "Delete failed", "error");
    }
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center">
        <p className="text-red-400">{loadError}</p>
        <Link href="/admin/affiliates" className="mt-4 inline-block text-sm text-neon hover:underline">
          Back to CRM
        </Link>
      </div>
    );
  }

  if (!affiliate) {
    return <AdminSkeleton rows={6} />;
  }

  const overdue = isFollowUpOverdue(affiliate.nextFollowUpAt);

  return (
    <div className="space-y-8">
      <AdminBreadcrumbs
        items={[
          { label: "Affiliate CRM", href: "/admin/affiliates" },
          { label: affiliate.companyName },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{affiliate.companyName}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[affiliate.status] ?? ""}`}>
              {affiliate.status.replace(/_/g, " ")}
            </span>
            {overdue && (
              <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                Follow-up overdue
              </span>
            )}
          </div>
          {affiliate.category && <p className="mt-1 text-sm text-muted">{affiliate.category}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {affiliate.signupUrl && (
            <>
              <a href={affiliate.signupUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-dark-border px-3 py-2 text-sm text-muted hover:text-neon">
                Open signup
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(affiliate.signupUrl!);
                  toast("Signup URL copied");
                }}
                className="rounded-lg border border-dark-border px-3 py-2 text-sm text-muted hover:text-white"
              >
                Copy signup URL
              </button>
            </>
          )}
          <button onClick={() => quickAction("contacted")} className="rounded-lg bg-neon/10 px-3 py-2 text-sm text-neon">
            Mark contacted
          </button>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-muted">Follow-up:</span>
            {[1, 3, 7, 14].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => quickAction("followup", days)}
                className="rounded-lg border border-dark-border px-2 py-1 text-xs text-muted hover:text-white"
              >
                {days}d
              </button>
            ))}
          </div>
          {!affiliate.toolId && (
            <button
              onClick={createToolFromAffiliate}
              disabled={creatingTool}
              className="rounded-lg bg-neon px-3 py-2 text-sm font-semibold text-ink disabled:opacity-50"
            >
              {creatingTool ? "Creating..." : "Create & link tool"}
            </button>
          )}
          {isAdmin && (
            <button onClick={remove} className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400">
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm">
          <p className="text-muted">Commission</p>
          <p className="font-medium">{affiliate.commission ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm">
          <p className="text-muted">Cookie / recurring</p>
          <p className="font-medium">{affiliate.cookieDuration ?? "—"} · {affiliate.isRecurring ? "Recurring" : "One-time"}</p>
        </div>
        <div className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm">
          <p className="text-muted">Assignee</p>
          <p className="font-medium">{affiliate.assignedTo?.name ?? "Unassigned"}</p>
        </div>
        <div className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm">
          <p className="text-muted">Network</p>
          <p className="font-medium">{affiliate.affiliateNetwork ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm">
          <p className="text-muted">Signup URL</p>
          {affiliate.signupUrl ? (
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 truncate font-medium text-white" title={affiliate.signupUrl}>
                {affiliate.signupUrl}
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(affiliate.signupUrl!);
                  toast("Signup URL copied");
                }}
                className="shrink-0 text-xs text-neon hover:underline"
              >
                Copy
              </button>
            </div>
          ) : (
            <p className="font-medium">—</p>
          )}
        </div>
      </div>

      {affiliate.tool ? (
        <div className="rounded-xl border border-dark-border bg-dark-elevated p-4 text-sm">
          Linked tool:{" "}
          <Link href={`/tools/${affiliate.tool.slug}`} target="_blank" className="text-neon hover:underline">
            {affiliate.tool.name}
          </Link>
          <span className="ml-2 rounded-full border border-dark-border px-2 py-0.5 text-xs text-muted">
            {affiliate.tool.published ? "Published" : "Draft"}
          </span>
          {" · "}
          <Link href={`/admin/tools/${affiliate.toolId}`} className="text-muted hover:text-neon">
            Edit in Tools
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
          No tool on site yet. Use <strong>Create & link tool</strong> to start a draft listing.
        </div>
      )}

      {affiliate.status === "ACTIVE" && !affiliate.affiliateUrl && (
        <p className="text-sm text-amber-400">Status is ACTIVE but no affiliate tracking URL — add one below to sync to the linked tool.</p>
      )}

      <section className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
        <h2 className="mb-4 font-semibold">Edit program</h2>
        <AdminAffiliateForm form={form} onChange={setForm} users={users} tools={tools} />
        {isDirty && <p className="mt-3 text-xs text-amber-400">You have unsaved changes</p>}
        <div className="mt-6 flex gap-3">
          <button onClick={save} disabled={saving} className="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-ink hover:bg-neon-dim disabled:opacity-50">
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirmDiscardChanges(isDirty)) router.push("/admin/affiliates");
            }}
            className="rounded-xl border border-dark-border px-5 py-2.5 text-sm text-muted"
          >
            Cancel
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
        <h2 className="mb-4 font-semibold">Activity timeline</h2>
        <form onSubmit={addNote} className="mb-6 flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an internal note..."
            className="flex-1 rounded-xl border border-dark-border bg-dark px-4 py-2 text-sm text-white focus:border-neon/50 focus:outline-none"
          />
          <button type="submit" className="rounded-xl bg-neon px-4 py-2 text-sm font-semibold text-ink">
            Add note
          </button>
        </form>
        <ul className="space-y-3">
          {(affiliate.activities ?? []).length === 0 ? (
            <li className="text-sm text-muted">No activity yet.</li>
          ) : (
            (affiliate.activities as AffiliateActivity[]).map((act) => (
              <li key={act.id} className="rounded-xl border border-dark-border bg-dark p-4 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium capitalize text-neon">{act.type.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted">
                    {new Date(act.createdAt).toLocaleString()}
                    {act.user ? ` · ${act.user.name}` : ""}
                  </span>
                </div>
                <p className="text-muted">{act.content}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

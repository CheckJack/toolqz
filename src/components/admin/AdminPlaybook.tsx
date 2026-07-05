"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Eye, EyeOff, Lock, Pencil, Pin, Plus, Search, Trash2 } from "lucide-react";
import {
  PLAYBOOK_CATEGORIES,
  PLAYBOOK_CATEGORY_LABELS,
  type PlaybookCategory,
} from "@/constants/admin-playbook";
import { SessionUser } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActionsMenu } from "@/components/admin/AdminRowActionsMenu";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";

interface PlaybookItem {
  id: string;
  question: string;
  answer: string;
  answerHidden?: boolean;
  sensitive: boolean;
  category: string;
  aliases: string | null;
  tags: string | null;
  pinned: boolean;
  sortOrder: number;
  score?: number;
  matchReason?: string | null;
  createdBy: { id: string; name: string } | null;
}

const emptyForm = {
  question: "",
  answer: "",
  category: "affiliate_forms" as PlaybookCategory,
  aliases: "",
  tags: "",
  pinned: false,
  sensitive: false,
};

const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none";

export function AdminPlaybook({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const isAdmin = user.role === "ADMIN";
  const [items, setItems] = useState<PlaybookItem[]>([]);
  const [counts, setCounts] = useState<{ all: number; categories: Record<string, number> } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PlaybookCategory | "">("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category) params.set("category", category);

      const res = await fetch(`/api/admin/playbook?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to load playbook");
      }
      setItems(data.items ?? []);
      setCounts(data.counts ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load playbook";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [search, category, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyAnswer(id: string, text: string, sensitive?: boolean) {
    try {
      let value = text;
      if (sensitive) {
        const res = await fetch(`/api/admin/playbook/${id}?reveal=true`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Could not reveal answer");
        value = data.snippet?.answer ?? "";
      }
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
      toast("Copied to clipboard", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not copy", "error");
    }
  }

  async function handleCreate() {
    setFormError("");
    if (!form.question.trim() || !form.answer.trim()) {
      setFormError("Question and answer are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to create snippet");
      toast("Snippet added", "success");
      setShowForm(false);
      setForm(emptyForm);
      void load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create snippet");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave() {
    if (!editId) return;
    setFormError("");
    if (!editForm.question.trim() || !editForm.answer.trim()) {
      setFormError("Question and answer are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/playbook/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update snippet");
      toast("Snippet updated", "success");
      setEditId(null);
      void load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update snippet");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this snippet?")) return;
    try {
      const res = await fetch(`/api/admin/playbook/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      toast("Snippet deleted", "success");
      void load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  }

  async function openEdit(item: PlaybookItem) {
    setFormError("");
    let answer = item.answer;

    if (item.sensitive) {
      try {
        const res = await fetch(`/api/admin/playbook/${item.id}?reveal=true`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Could not load sensitive answer");
        answer = data.snippet?.answer ?? "";
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not load snippet", "error");
        return;
      }
    }

    setEditId(item.id);
    setEditForm({
      question: item.question,
      answer,
      category: (item.category as PlaybookCategory) || "other",
      aliases: item.aliases ?? "",
      tags: item.tags ?? "",
      pinned: item.pinned,
      sensitive: item.sensitive,
    });
  }

  const pinnedItems = !search ? items.filter((i) => i.pinned) : [];
  const listItems = !search ? items.filter((i) => !i.pinned) : items;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Playbook"
        description={
          search
            ? `${items.length} match${items.length === 1 ? "" : "es"} for “${search}”`
            : `${counts?.all ?? items.length} snippet${(counts?.all ?? items.length) === 1 ? "" : "s"} · search by question, alias, or keywords`
        }
        action={
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setFormError("");
            }}
            className="admin-btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add snippet
          </button>
        }
      />

      <div className="admin-card overflow-hidden">
        <div className="space-y-3 border-b border-dark-border px-4 py-3 sm:px-5 sm:py-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search e.g. why should you promote us, company about, traffic…"
              className="w-full rounded-lg border border-dark-border bg-dark py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-muted-dim focus:border-neon/40 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="admin-segmented max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={`admin-segmented-btn whitespace-nowrap ${category === "" ? "admin-segmented-btn-active" : ""}`}
            >
              All
              {counts && (
                <span className="ml-1.5 tabular-nums opacity-70">{counts.all}</span>
              )}
            </button>
            {PLAYBOOK_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`admin-segmented-btn whitespace-nowrap ${category === c.value ? "admin-segmented-btn-active" : ""}`}
              >
                {c.label}
                {counts?.categories?.[c.value] != null && (
                  <span className="ml-1.5 tabular-nums opacity-70">
                    {counts.categories[c.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="border-b border-red-500/20 bg-red-500/5 px-4 py-4 text-sm text-red-200 sm:px-5">
            {error}
            <button type="button" onClick={() => void load()} className="mt-2 block text-neon hover:underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-4 sm:p-5">
            <AdminSkeleton rows={5} />
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-5">
            <p className="text-sm text-muted">
              {search
                ? "No snippets matched. Try different words or add aliases to existing entries."
                : "No snippets yet. Add your first affiliate form answer or email template."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="admin-btn-primary mt-4 inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add snippet
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6 p-4 sm:p-5">
            {pinnedItems.length > 0 && (
              <section>
                <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-dim">
                  <Pin className="h-3 w-3" />
                  Pinned
                </h2>
                <div className="space-y-3">
                  {pinnedItems.map((item) => (
                    <SnippetCard
                      key={item.id}
                      item={item}
                      copiedId={copiedId}
                      isAdmin={isAdmin}
                      onCopy={copyAnswer}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      showMatch={Boolean(search)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              {pinnedItems.length > 0 && listItems.length > 0 && (
                <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-dim">
                  {search ? "Results" : "All snippets"}
                </h2>
              )}
              <div className="space-y-3">
                {listItems.map((item) => (
                  <SnippetCard
                    key={item.id}
                    item={item}
                    copiedId={copiedId}
                    isAdmin={isAdmin}
                    onCopy={copyAnswer}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    showMatch={Boolean(search)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {(showForm || editId) && (
        <PlaybookFormModal
          title={editId ? "Edit snippet" : "Add snippet"}
          form={editId ? editForm : form}
          onChange={editId ? setEditForm : setForm}
          error={formError}
          saving={saving}
          onClose={() => {
            setShowForm(false);
            setEditId(null);
            setFormError("");
          }}
          onSave={() => void (editId ? handleEditSave() : handleCreate())}
        />
      )}
    </div>
  );
}

function SnippetCard({
  item,
  copiedId,
  isAdmin,
  onCopy,
  onEdit,
  onDelete,
  showMatch,
}: {
  item: PlaybookItem;
  copiedId: string | null;
  isAdmin: boolean;
  onCopy: (id: string, text: string, sensitive?: boolean) => void;
  onEdit: (item: PlaybookItem) => void;
  onDelete: (id: string) => void;
  showMatch: boolean;
}) {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  const categoryLabel =
    PLAYBOOK_CATEGORY_LABELS[item.category as PlaybookCategory] ?? item.category;

  const isHidden = item.sensitive && !revealed;
  const displayAnswer = revealed && revealedAnswer ? revealedAnswer : item.answer;

  async function toggleReveal() {
    if (revealed) {
      setRevealed(false);
      setRevealedAnswer(null);
      return;
    }

    setRevealing(true);
    try {
      const res = await fetch(`/api/admin/playbook/${item.id}?reveal=true`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not reveal answer");
      setRevealedAnswer(data.snippet?.answer ?? "");
      setRevealed(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not reveal answer", "error");
    } finally {
      setRevealing(false);
    }
  }

  return (
    <article className="rounded-xl border border-dark-border bg-dark/40 p-4 transition hover:border-border-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-white">{item.question}</h3>
            {item.pinned && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-neon/10 px-2 py-0.5 text-[10px] font-medium text-neon">
                <Pin className="h-2.5 w-2.5" />
                Pinned
              </span>
            )}
            {item.sensitive && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200/90">
                <Lock className="h-2.5 w-2.5" />
                Sensitive
              </span>
            )}
            <span className="rounded-full bg-dark-border px-2 py-0.5 text-[10px] text-muted">
              {categoryLabel}
            </span>
          </div>
          {showMatch && item.matchReason && (
            <p className="mt-1 text-[11px] text-neon/80">Matched: {item.matchReason}</p>
          )}
          <p
            className={`mt-2 whitespace-pre-wrap text-[13px] leading-relaxed line-clamp-4 ${
              isHidden ? "font-mono tracking-widest text-muted-dim" : "text-muted"
            }`}
          >
            {displayAnswer}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {item.sensitive && (
            <button
              type="button"
              onClick={() => void toggleReveal()}
              disabled={revealing}
              className="admin-toolbar-btn inline-flex items-center gap-1.5 py-1.5 text-xs"
              title={revealed ? "Hide answer" : "Reveal answer"}
            >
              {revealed ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {revealing ? "…" : revealed ? "Hide" : "Reveal"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onCopy(item.id, revealedAnswer ?? item.answer, item.sensitive)}
            className="admin-toolbar-btn inline-flex items-center gap-1.5 py-1.5 text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedId === item.id ? "Copied" : "Copy"}
          </button>
          <AdminRowActionsMenu label={`Actions for ${item.question}`}>
            {(close) => (
              <>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-white/5"
                  onClick={() => {
                    onEdit(item);
                    close();
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      onDelete(item.id);
                      close();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </>
            )}
          </AdminRowActionsMenu>
        </div>
      </div>
    </article>
  );
}

function PlaybookFormModal({
  title,
  form,
  onChange,
  error,
  saving,
  onClose,
  onSave,
}: {
  title: string;
  form: typeof emptyForm;
  onChange: (form: typeof emptyForm) => void;
  error: string;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="admin-card max-h-[90vh] w-full max-w-lg overflow-y-auto admin-card-pad"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        <h3 className="admin-section-title">{title}</h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Question / form label</label>
            <input
              className={inputClass}
              value={form.question}
              onChange={(e) => onChange({ ...form, question: e.target.value })}
              placeholder="Why should affiliates promote TOOLQZ?"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Answer to copy</label>
            <textarea
              className={`${inputClass} min-h-[8rem] resize-y`}
              value={form.answer}
              onChange={(e) => onChange({ ...form, answer: e.target.value })}
              placeholder="TOOLQZ is a curated directory of…"
            />
          </div>

          <label className="flex items-start gap-2 rounded-lg border border-dark-border bg-dark/60 p-3 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.sensitive}
              onChange={(e) => onChange({ ...form, sensitive: e.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-dark-border bg-dark accent-amber-400"
            />
            <span>
              <span className="inline-flex items-center gap-1.5 font-medium text-white">
                <Lock className="h-3.5 w-3.5 text-amber-200/90" />
                Mark as sensitive
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-muted-dim">
                Encrypts the answer at rest (passwords, API keys, login details). Hidden in the list
                until you click Reveal.
              </span>
            </span>
          </label>

          <div>
            <label className="mb-1 block text-xs text-muted">Category</label>
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) =>
                onChange({ ...form, category: e.target.value as PlaybookCategory })
              }
            >
              {PLAYBOOK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Search aliases</label>
            <textarea
              className={`${inputClass} min-h-[5rem] resize-y font-mono text-[12px]`}
              value={form.aliases}
              onChange={(e) => onChange({ ...form, aliases: e.target.value })}
              placeholder={"why should you promote us\nwhy join your program\npromotion rationale"}
            />
            <p className="mt-1 text-[11px] text-muted-dim">
              One per line — alternate phrasings people might search while filling forms.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Tags (optional)</label>
            <input
              className={inputClass}
              value={form.tags}
              onChange={(e) => onChange({ ...form, tags: e.target.value })}
              placeholder="traffic, audience, seo"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => onChange({ ...form, pinned: e.target.checked })}
              className="h-4 w-4 rounded border-dark-border bg-dark accent-neon"
            />
            Pin to top (e.g. company pitch, address)
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="admin-btn-primary disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={onClose} className="admin-toolbar-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

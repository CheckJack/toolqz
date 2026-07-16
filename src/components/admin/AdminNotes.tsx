"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Lock,
  Users,
  Plus,
  Pin,
  Trash2,
  Link2,
  Paperclip,
  Search,
  Save,
} from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import { NoteRichTextEditor } from "@/components/admin/NoteRichTextEditor";
import {
  NOTE_VISIBILITY_LABELS,
  type NoteVisibility,
} from "@/constants/admin-notes";

type SessionUser = { id: string; name: string; role: string };

type NoteLink = { id: string; label: string; url: string };
type NoteAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
};

type Note = {
  id: string;
  title: string;
  content: string;
  visibility: NoteVisibility;
  pinned: boolean;
  createdById: string;
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  links: NoteLink[];
  attachments: NoteAttachment[];
};

const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark-elevated px-3 py-2 text-[15px] text-white placeholder:text-muted-dim focus:border-white/20 focus:outline-none focus:ring-[3px] focus:ring-neon/10";

export function AdminNotes({ user }: { user: SessionUser }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "private" | "shared" | "mine">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftVisibility, setDraftVisibility] = useState<NoteVisibility>("PRIVATE");
  const [draftPinned, setDraftPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (filter === "private") params.set("visibility", "PRIVATE");
      if (filter === "shared") params.set("visibility", "SHARED");
      if (filter === "mine") params.set("mine", "1");
      const res = await fetch(`/api/admin/notes?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setNotes(data.items ?? []);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load notes", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, query, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    setDraftTitle(selected.title);
    setDraftContent(selected.content);
    setDraftVisibility(selected.visibility);
    setDraftPinned(selected.pinned);
  }, [selected]);

  function selectNote(note: Note) {
    setSelectedId(note.id);
  }

  async function createNote() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled note",
          content: "",
          visibility: "PRIVATE",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create");
      setNotes((prev) => [data, ...prev]);
      setSelectedId(data.id);
      toast("Note created", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create note", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveNote() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/notes/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle,
          content: draftContent,
          visibility: draftVisibility,
          pinned: draftPinned,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setNotes((prev) => prev.map((n) => (n.id === data.id ? data : n)));
      toast("Note saved", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote() {
    if (!selected) return;
    if (!confirm(`Delete “${selected.title}”? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/notes/${selected.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.error || "Could not delete", "error");
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== selected.id));
    setSelectedId(null);
    toast("Note deleted", "success");
  }

  async function addLink() {
    if (!selected || !linkUrl.trim()) return;
    const res = await fetch(`/api/admin/notes/${selected.id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: linkUrl.trim(), label: linkLabel.trim() || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Could not add link", "error");
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === data.id ? data : n)));
    setLinkLabel("");
    setLinkUrl("");
    toast("Link added", "success");
  }

  async function removeLink(linkId: string) {
    if (!selected) return;
    const res = await fetch(`/api/admin/notes/${selected.id}/links/${linkId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Could not remove link", "error");
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === data.id ? data : n)));
  }

  async function uploadFile(file: File) {
    if (!selected) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/notes/${selected.id}/attachments`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setNotes((prev) => prev.map((n) => (n.id === data.id ? data : n)));
      toast("File uploaded", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function removeAttachment(attachmentId: string) {
    if (!selected) return;
    const res = await fetch(
      `/api/admin/notes/${selected.id}/attachments/${attachmentId}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok) {
      toast(data.error || "Could not remove file", "error");
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === data.id ? data : n)));
  }

  const canEdit =
    !!selected &&
    (selected.createdById === user.id ||
      user.role === "ADMIN" ||
      selected.visibility === "SHARED");

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-80">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-white">Notes</h1>
          <button
            type="button"
            onClick={() => void createNote()}
            disabled={saving}
            className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className={`${inputClass} pl-9`}
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {(
            [
              ["all", "All"],
              ["mine", "Mine"],
              ["private", "Private"],
              ["shared", "Shared"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1 text-[12px] ${
                filter === key
                  ? "bg-white/15 text-white"
                  : "bg-dark-elevated text-muted hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="surface max-h-[60vh] flex-1 overflow-y-auto rounded-xl">
          {loading ? (
            <p className="p-4 text-sm text-muted">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="p-4 text-sm text-muted">No notes yet. Create one to get started.</p>
          ) : (
            <ul className="divide-y divide-dark-border">
              {notes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => selectNote(note)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                      selectedId === note.id ? "bg-white/10" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-1 font-medium text-white">
                        {note.pinned ? "📌 " : ""}
                        {note.title || "Untitled"}
                      </span>
                      {note.visibility === "PRIVATE" ? (
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-dim" />
                      ) : (
                        <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-dim" />
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-muted-dim">
                      {note.createdBy.name} ·{" "}
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section className="surface min-w-0 flex-1 rounded-xl p-4 sm:p-6">
        {!selected ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center text-muted">
            <p>Select a note or create a new one.</p>
            <p className="mt-2 max-w-md text-sm text-muted-dim">
              Private notes are only visible to you. Shared notes are visible to the whole team.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  disabled={!canEdit}
                  className={`${inputClass} text-lg font-semibold`}
                  placeholder="Note title"
                />
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex items-center gap-2 text-muted">
                    Visibility
                    <select
                      value={draftVisibility}
                      disabled={!canEdit}
                      onChange={(e) =>
                        setDraftVisibility(e.target.value as NoteVisibility)
                      }
                      className="rounded-md border border-dark-border bg-dark-elevated px-2 py-1 text-white"
                    >
                      <option value="PRIVATE">{NOTE_VISIBILITY_LABELS.PRIVATE}</option>
                      <option value="SHARED">{NOTE_VISIBILITY_LABELS.SHARED}</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-muted">
                    <input
                      type="checkbox"
                      checked={draftPinned}
                      disabled={!canEdit}
                      onChange={(e) => setDraftPinned(e.target.checked)}
                    />
                    <Pin className="h-3.5 w-3.5" />
                    Pinned
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => void saveNote()}
                    disabled={saving}
                    className="btn-primary inline-flex items-center gap-1.5 px-4 py-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save"}
                  </button>
                )}
                {(selected.createdById === user.id || user.role === "ADMIN") && (
                  <button
                    type="button"
                    onClick={() => void deleteNote()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>

            <NoteRichTextEditor
              key={selected.id}
              value={draftContent}
              onChange={setDraftContent}
              editable={canEdit}
            />

            <div className="grid gap-5 border-t border-dark-border pt-5 md:grid-cols-2">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <Link2 className="h-4 w-4" />
                  Links
                </h3>
                <ul className="mb-3 space-y-2">
                  {selected.links.length === 0 && (
                    <li className="text-sm text-muted-dim">No links yet.</li>
                  )}
                  {selected.links.map((link) => (
                    <li
                      key={link.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-dark-border px-3 py-2 text-sm"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-neon hover:underline"
                      >
                        {link.label || link.url}
                      </a>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => void removeLink(link.id)}
                          className="text-muted hover:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {canEdit && (
                  <div className="space-y-2">
                    <input
                      value={linkLabel}
                      onChange={(e) => setLinkLabel(e.target.value)}
                      placeholder="Label (optional)"
                      className={inputClass}
                    />
                    <div className="flex gap-2">
                      <input
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://…"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => void addLink()}
                        className="btn-ghost shrink-0 border border-dark-border px-3"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <Paperclip className="h-4 w-4" />
                  Uploads
                </h3>
                <ul className="mb-3 space-y-2">
                  {selected.attachments.length === 0 && (
                    <li className="text-sm text-muted-dim">No files yet.</li>
                  )}
                  {selected.attachments.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-dark-border px-3 py-2 text-sm"
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-neon hover:underline"
                      >
                        {file.fileName}
                      </a>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => void removeAttachment(file.id)}
                          className="text-muted hover:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {canEdit && (
                  <label className="btn-ghost inline-flex cursor-pointer items-center border border-dark-border px-3 py-2 text-sm">
                    {uploading ? "Uploading…" : "Upload file"}
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadFile(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
                <p className="mt-2 text-[12px] text-muted-dim">
                  Images, PDF, docs, zip — max 10MB. Files are stored on the server under /uploads.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

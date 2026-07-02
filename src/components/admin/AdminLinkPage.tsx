"use client";

import { useCallback, useEffect, useState } from "react";
import { DragHandle, useListDragReorder } from "@/components/admin/DraggableReorder";
import { LinkPageView } from "@/components/links/LinkPageView";
import { useToast } from "@/components/admin/Toast";
import type { LinkPageSettings, LinkPageUpdatePayload } from "@/types/link-page";

const fieldClass =
  "w-full rounded-lg border border-dark-border bg-dark-elevated px-3 py-2 text-sm text-white placeholder:text-muted-dim focus:border-white/20 focus:outline-none focus:ring-[3px] focus:ring-neon/10";

function emptyLink(sortOrder: number) {
  return {
    id: `new-${Date.now()}-${sortOrder}`,
    title: "",
    url: "",
    icon: "",
    sortOrder,
    enabled: true,
  };
}

export function AdminLinkPage() {
  const { toast } = useToast();
  const [page, setPage] = useState<LinkPageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/link-page");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setPage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { getItemProps } = useListDragReorder(page?.links ?? [], (links) => {
    if (!page) return;
    setPage({
      ...page,
      links: links.map((link, index) => ({ ...link, sortOrder: index })),
    });
  });

  function updateField<K extends keyof LinkPageSettings>(key: K, value: LinkPageSettings[K]) {
    if (!page) return;
    setPage({ ...page, [key]: value });
  }

  function updateLink(index: number, patch: Partial<LinkPageSettings["links"][number]>) {
    if (!page) return;
    const links = [...page.links];
    links[index] = { ...links[index], ...patch };
    setPage({ ...page, links });
  }

  function addLink() {
    if (!page) return;
    setPage({
      ...page,
      links: [...page.links, emptyLink(page.links.length)],
    });
  }

  function removeLink(index: number) {
    if (!page) return;
    const links = page.links
      .filter((_, i) => i !== index)
      .map((link, i) => ({ ...link, sortOrder: i }));
    setPage({ ...page, links });
  }

  async function handleSave() {
    if (!page) return;
    setSaving(true);
    setError("");

    const payload: LinkPageUpdatePayload = {
      title: page.title,
      bio: page.bio,
      avatarUrl: page.avatarUrl,
      backgroundType: page.backgroundType,
      backgroundColor: page.backgroundColor,
      gradientFrom: page.gradientFrom,
      gradientTo: page.gradientTo,
      buttonColor: page.buttonColor,
      buttonTextColor: page.buttonTextColor,
      buttonStyle: page.buttonStyle,
      showBranding: page.showBranding,
      links: page.links.map((link, index) => ({
        id: link.id.startsWith("new-") ? undefined : link.id,
        title: link.title,
        url: link.url,
        icon: link.icon,
        sortOrder: index,
        enabled: link.enabled,
      })),
    };

    try {
      const res = await fetch("/api/admin/link-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setPage(data);
      toast("Link page saved", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-muted">Loading link page...</p>;
  }

  if (!page) {
    return <p className="text-red-400">{error || "Could not load link page."}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Link page</h1>
          <p className="mt-1 text-sm text-muted">
            Your Linktree-style page at{" "}
            <a
              href="/links"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon hover:underline"
            >
              /links
            </a>
            . Not shown in the main menu.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary shrink-0 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="surface rounded-xl p-5">
            <h2 className="text-sm font-medium text-white">Profile</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs text-muted">Title</label>
                <input
                  className={fieldClass}
                  value={page.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="TOOLQZ"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs text-muted">Bio</label>
                <textarea
                  className={`${fieldClass} min-h-20 resize-y`}
                  value={page.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  placeholder="Short description for your link page"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs text-muted">Avatar image URL</label>
                <input
                  className={fieldClass}
                  value={page.avatarUrl ?? ""}
                  onChange={(e) => updateField("avatarUrl", e.target.value || null)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          <section className="surface rounded-xl p-5">
            <h2 className="text-sm font-medium text-white">Appearance</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-muted">Background</label>
                <select
                  className={fieldClass}
                  value={page.backgroundType}
                  onChange={(e) =>
                    updateField("backgroundType", e.target.value as LinkPageSettings["backgroundType"])
                  }
                >
                  <option value="gradient">Gradient</option>
                  <option value="solid">Solid color</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted">Button shape</label>
                <select
                  className={fieldClass}
                  value={page.buttonStyle}
                  onChange={(e) =>
                    updateField("buttonStyle", e.target.value as LinkPageSettings["buttonStyle"])
                  }
                >
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                  <option value="square">Square</option>
                </select>
              </div>
              {page.backgroundType === "solid" ? (
                <div>
                  <label className="mb-1.5 block text-xs text-muted">Background color</label>
                  <input
                    type="color"
                    className="h-10 w-full cursor-pointer rounded-lg border border-dark-border bg-dark-elevated"
                    value={page.backgroundColor}
                    onChange={(e) => updateField("backgroundColor", e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs text-muted">Gradient from</label>
                    <input
                      type="color"
                      className="h-10 w-full cursor-pointer rounded-lg border border-dark-border bg-dark-elevated"
                      value={page.gradientFrom}
                      onChange={(e) => updateField("gradientFrom", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-muted">Gradient to</label>
                    <input
                      type="color"
                      className="h-10 w-full cursor-pointer rounded-lg border border-dark-border bg-dark-elevated"
                      value={page.gradientTo}
                      onChange={(e) => updateField("gradientTo", e.target.value)}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="mb-1.5 block text-xs text-muted">Button color</label>
                <input
                  type="color"
                  className="h-10 w-full cursor-pointer rounded-lg border border-dark-border bg-dark-elevated"
                  value={page.buttonColor}
                  onChange={(e) => updateField("buttonColor", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted">Button text color</label>
                <input
                  type="color"
                  className="h-10 w-full cursor-pointer rounded-lg border border-dark-border bg-dark-elevated"
                  value={page.buttonTextColor}
                  onChange={(e) => updateField("buttonTextColor", e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
                <input
                  type="checkbox"
                  checked={page.showBranding}
                  onChange={(e) => updateField("showBranding", e.target.checked)}
                  className="rounded border-dark-border"
                />
                Show TOOLQZ branding at the bottom
              </label>
            </div>
          </section>

          <section className="surface rounded-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-white">Links</h2>
              <button type="button" onClick={addLink} className="btn-ghost text-xs">
                + Add link
              </button>
            </div>

            <ul className="mt-4 space-y-3">
              {page.links.map((link, index) => {
                const drag = getItemProps(index);
                return (
                  <li
                    key={link.id}
                    className={`rounded-lg border border-dark-border bg-dark p-3 ${drag.dragClass}`}
                    draggable={drag.draggable}
                    onDragStart={drag.onDragStart}
                    onDragOver={drag.onDragOver}
                    onDrop={drag.onDrop}
                    onDragEnd={drag.onDragEnd}
                  >
                    <div className="flex items-start gap-3">
                      <DragHandle />
                      <div className="grid flex-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] text-muted">Title</label>
                          <input
                            className={fieldClass}
                            value={link.title}
                            onChange={(e) => updateLink(index, { title: e.target.value })}
                            placeholder="Instagram"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] text-muted">URL</label>
                          <input
                            className={fieldClass}
                            value={link.url}
                            onChange={(e) => updateLink(index, { url: e.target.value })}
                            placeholder="https://instagram.com/..."
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] text-muted">Icon (emoji)</label>
                          <input
                            className={fieldClass}
                            value={link.icon ?? ""}
                            onChange={(e) => updateLink(index, { icon: e.target.value || null })}
                            placeholder="📸"
                          />
                        </div>
                        <div className="flex items-end justify-between gap-3">
                          <label className="flex items-center gap-2 text-sm text-muted">
                            <input
                              type="checkbox"
                              checked={link.enabled}
                              onChange={(e) => updateLink(index, { enabled: e.target.checked })}
                              className="rounded border-dark-border"
                            />
                            Visible
                          </label>
                          <button
                            type="button"
                            onClick={() => removeLink(index)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Live preview
          </p>
          <LinkPageView page={page} preview />
        </aside>
      </div>
    </div>
  );
}

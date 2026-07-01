"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BlogMarkdownPreview } from "@/components/BlogMarkdownPreview";
import { useToast } from "@/components/admin/Toast";
import { slugifyBlogTitle } from "@/lib/blog-payload";
import type { BlogPost } from "@/types/blog";

const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark-elevated px-4 py-2.5 text-[15px] text-white placeholder:text-muted-dim transition-[border-color,box-shadow] focus:border-white/20 focus:outline-none focus:ring-[3px] focus:ring-neon/10";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  published: false,
};

export function AdminBlogEditor({ id }: { id: string }) {
  const isNew = id === "new";
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    fetch(`/api/admin/blog/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((post: BlogPost) => {
        setForm({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage ?? "",
          published: post.published,
        });
        setSlugTouched(true);
      })
      .catch(() => toast("Could not load post", "error"))
      .finally(() => setLoading(false));
  }, [id, isNew, toast]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugTouched) {
        next.slug = slugifyBlogTitle(String(value));
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isNew ? "/api/admin/blog" : `/api/admin/blog/${id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          coverImage: form.coverImage || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error ?? "Could not save post", "error");
        return;
      }
      toast(isNew ? "Post created" : "Post saved", "success");
      if (isNew) {
        router.push(`/admin/blog/${data.id}`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isNew) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Could not delete post", "error");
      return;
    }
    toast("Post deleted", "success");
    router.push("/admin/blog");
    router.refresh();
  }

  if (loading) {
    return <p className="text-muted">Loading post…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/blog" className="text-sm text-muted hover:text-white">
            ← Back to blog
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            {isNew ? "New post" : "Edit post"}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="btn-ghost border border-dark-border px-4 py-2"
          >
            {preview ? "Edit" : "Preview"}
          </button>
          {!isNew && form.published && (
            <a
              href={`/blog/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost border border-dark-border px-4 py-2"
            >
              View live
            </a>
          )}
        </div>
      </div>

      {preview ? (
        <div className="surface rounded-xl p-6 sm:p-8">
          <p className="mb-2 text-[13px] text-muted-dim">Preview</p>
          <h2 className="text-2xl font-semibold text-white">{form.title || "Untitled"}</h2>
          {form.excerpt && <p className="mt-3 text-muted">{form.excerpt}</p>}
          <div className="mt-8">
            <BlogMarkdownPreview content={form.content || "*No content yet.*"} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-[13px] text-muted">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className={inputClass}
                placeholder="Article title"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] text-muted">Slug</label>
              <input
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
                className={inputClass}
                placeholder="url-friendly-slug"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] text-muted">Cover image URL</label>
              <input
                value={form.coverImage}
                onChange={(e) => set("coverImage", e.target.value)}
                className={inputClass}
                placeholder="https://…"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] text-muted">Excerpt</label>
            <textarea
              required
              rows={2}
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              className={`${inputClass} resize-y`}
              placeholder="Short summary for the blog listing and SEO"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] text-muted">
              Content{" "}
              <span className="text-muted-dim">
                (## headings, **bold**, [links](url), - lists, &gt; quotes, [[tool:slug]], [[toc]])
              </span>
            </label>
            <textarea
              required
              rows={18}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              className={`${inputClass} resize-y font-mono text-[14px] leading-relaxed`}
              placeholder="Write your article…"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              className="rounded border-dark-border"
            />
            Published (visible on /blog)
          </label>

          <div className="flex flex-wrap gap-3 border-t border-dark-border pt-5">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? "Saving…" : isNew ? "Create post" : "Save changes"}
            </button>
            {!isNew && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

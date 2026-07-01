"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminSkeleton } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/components/admin/Toast";

interface SlugRedirectRow {
  id: string;
  oldSlug: string;
  createdAt: string;
  tool: {
    id: string;
    name: string;
    slug: string;
    published: boolean;
  };
}

export function AdminRedirects() {
  const { toast } = useToast();
  const [redirects, setRedirects] = useState<SlugRedirectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/admin/slug-redirects?${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRedirects)
      .catch(() => toast("Failed to load redirects", "error"))
      .finally(() => setLoading(false));
  }, [search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) setSearch(searchInput);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  async function removeRedirect(oldSlug: string) {
    if (!confirm(`Remove redirect from /tools/${oldSlug}? That URL will stop working.`)) return;
    const res = await fetch("/api/admin/slug-redirects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldSlug }),
    });
    if (res.ok) {
      toast("Redirect removed");
      load();
    } else {
      toast("Failed to remove redirect", "error");
    }
  }

  if (loading && redirects.length === 0) return <AdminSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Slug redirects</h1>
        <p className="text-muted">
          Old tool URLs that permanently forward to the current slug
        </p>
      </div>

      <input
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search old slug or tool name..."
        className="w-full max-w-md rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/50 focus:outline-none"
      />

      {redirects.length === 0 ? (
        <div className="rounded-2xl border border-dark-border bg-dark-elevated p-12 text-center text-muted">
          {search ? "No redirects match your search." : "No slug redirects yet. They are created when an admin changes a tool slug."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-left text-muted">
                  <th className="px-4 py-3 font-medium">Old URL</th>
                  <th className="px-4 py-3 font-medium">Current tool</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {redirects.map((r) => (
                  <tr key={r.id} className="border-b border-dark-border/50 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tools/${r.oldSlug}`}
                        target="_blank"
                        className="font-mono text-neon hover:underline"
                      >
                        /tools/{r.oldSlug}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/tools/${r.tool.id}`}
                        className="font-medium hover:text-neon"
                      >
                        {r.tool.name}
                      </Link>
                      <div className="text-xs text-muted">
                        /tools/{r.tool.slug}
                        {!r.tool.published && " · draft"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void removeRedirect(r.oldSlug)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

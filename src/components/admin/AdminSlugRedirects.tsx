"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";

interface SlugRedirect {
  id: string;
  oldSlug: string;
  createdAt: string;
}

export function AdminSlugRedirects({ toolId }: { toolId: string }) {
  const { toast } = useToast();
  const [redirects, setRedirects] = useState<SlugRedirect[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch(`/api/admin/tools/${toolId}/slug-redirects`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRedirects)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [toolId]);

  async function removeRedirect(oldSlug: string) {
    if (!confirm(`Remove redirect from /tools/${oldSlug}? That URL will stop working.`)) return;
    const res = await fetch(`/api/admin/tools/${toolId}/slug-redirects`, {
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

  if (loading) return null;
  if (redirects.length === 0) return null;

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-elevated p-4">
      <h3 className="text-sm font-semibold text-muted">Old tool URLs</h3>
      <p className="mt-1 text-xs text-muted">
        If you change a tool&apos;s slug, the old link still works and forwards to the new one.
      </p>
      <ul className="mt-3 space-y-2">
        {redirects.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dark-border px-3 py-2 text-sm"
          >
            <div>
              <Link
                href={`/tools/${r.oldSlug}`}
                target="_blank"
                className="font-mono text-neon hover:underline"
              >
                /tools/{r.oldSlug}
              </Link>
              <span className="ml-2 text-xs text-muted">
                since {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void removeRedirect(r.oldSlug)}
              className="text-xs text-red-400 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

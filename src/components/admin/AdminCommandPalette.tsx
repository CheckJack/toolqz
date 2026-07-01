"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface SearchResult {
  pages: { id: string; label: string; href: string }[];
  tools: { id: string; name: string; slug: string }[];
  affiliates: { id: string; companyName: string; status: string }[];
}

type ResultItem =
  | { type: "page"; id: string; label: string; href: string; meta?: string }
  | { type: "tool"; id: string; label: string; href: string; meta?: string }
  | { type: "affiliate"; id: string; label: string; href: string; meta?: string };

export function AdminCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const flatResults: ResultItem[] = results
    ? [
        ...results.pages.map((p) => ({
          type: "page" as const,
          id: p.id,
          label: p.label,
          href: p.href,
          meta: "Page",
        })),
        ...results.tools.map((t) => ({
          type: "tool" as const,
          id: t.id,
          label: t.name,
          href: `/admin/tools/${t.id}`,
          meta: `/tools/${t.slug}`,
        })),
        ...results.affiliates.map((a) => ({
          type: "affiliate" as const,
          id: a.id,
          label: a.companyName,
          href: `/admin/affiliates/${a.id}`,
          meta: a.status.replace(/_/g, " "),
        })),
      ]
    : [];

  const search = useCallback(async (q: string) => {
    const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data);
      setActiveIndex(0);
    }
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("admin:command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("admin:command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      return;
    }
    inputRef.current?.focus();
    search("");
  }, [open, search]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, open, search]);

  function navigate(item: ResultItem) {
    setOpen(false);
    router.push(item.href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && flatResults[activeIndex]) {
      e.preventDefault();
      navigate(flatResults[activeIndex]);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-dark-border bg-dark-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-dark-border px-4">
          <span className="text-muted">⌘K</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Jump to page, tool, or program..."
            className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-muted focus:outline-none"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto py-2">
          {flatResults.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted">No results</li>
          ) : (
            flatResults.map((item, i) => (
              <li key={`${item.type}-${item.id}`}>
                <button
                  type="button"
                  onClick={() => navigate(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm ${
                    i === activeIndex ? "bg-neon/10 text-white" : "text-muted hover:bg-dark/50"
                  }`}
                >
                  <span className="truncate font-medium">{item.label}</span>
                  <span className="shrink-0 text-xs capitalize text-muted">{item.meta}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-dark-border px-4 py-2 text-xs text-muted">
          ↑↓ navigate · Enter open · Esc close
        </div>
      </div>
    </div>
  );
}

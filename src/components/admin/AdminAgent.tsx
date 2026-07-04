"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/Toast";

type AgentStatus = { configured: boolean; enabled: boolean };

type AgentResult = {
  success: boolean;
  message: string;
  editUrl?: string;
  tool?: { id: string; name: string; slug: string };
};

export function AdminAgent() {
  const { toast } = useToast();
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/agent")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStatus(data))
      .catch(() => {});
  }, []);

  async function runAgent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim() || undefined,
          name: name.trim() || undefined,
          url: url.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Agent request failed");
      }

      setResult(data);
      toast(data.message ?? "Draft tool created", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Agent request failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  const ready = status?.configured && status?.enabled;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Agent</h1>
        <p className="mt-1 text-sm text-muted">
          Research a product website and create a draft tool listing automatically.
        </p>
      </div>

      {status && !status.configured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
          <code className="text-amber-100">GEMINI_API_KEY</code> is not set on the server. Add it in
          Hostinger environment variables, then redeploy.
        </div>
      )}

      {status && !status.enabled && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          Admin agent is disabled (<code>AGENT_ENABLED=false</code>).
        </div>
      )}

      <div className="rounded-2xl border border-dark-border bg-dark-elevated p-6">
        <form onSubmit={runAgent} className="space-y-4">
          <div>
            <label htmlFor="agent-message" className="mb-1 block text-sm text-muted">
              Instruction (optional)
            </label>
            <textarea
              id="agent-message"
              name="message"
              rows={3}
              className="w-full rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/50 focus:outline-none"
              placeholder="Create a tool for Linear at https://linear.app"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="agent-name" className="mb-1 block text-sm text-muted">
                Product name (optional)
              </label>
              <input
                id="agent-name"
                name="name"
                className="w-full rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/50 focus:outline-none"
                placeholder="Linear"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="agent-url" className="mb-1 block text-sm text-muted">
                Website URL *
              </label>
              <input
                id="agent-url"
                name="url"
                type="url"
                required={!message.trim()}
                className="w-full rounded-xl border border-dark-border bg-dark px-3 py-2 text-sm text-white focus:border-neon/50 focus:outline-none"
                placeholder="https://linear.app"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted">
            The agent fetches the website, researches with Gemini, and saves a{" "}
            <strong className="text-white">draft</strong> (unpublished). Affiliate URL is skipped.
            Review under Tools before publishing.
          </p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {result?.success && (
            <div className="rounded-xl border border-neon/30 bg-neon/5 px-4 py-3 text-sm">
              <p className="text-white">{result.message}</p>
              {result.editUrl && (
                <Link href={result.editUrl} className="mt-2 inline-block text-neon hover:underline">
                  Open draft tool →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !ready}
            className="rounded-xl bg-neon px-5 py-2.5 text-sm font-semibold text-ink hover:bg-neon-dim disabled:opacity-50"
          >
            {loading ? "Researching and creating draft…" : "Create draft tool"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-dark-border bg-dark-elevated p-5 text-sm text-muted">
        <p className="font-medium text-white">What the agent fills in</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Name, slug, category, description, overview</li>
          <li>5+ highlights, 4+ tags, 5+ pros, 4+ cons</li>
          <li>3–4 how-it-works steps, pricing tiers, 5+ FAQs</li>
          <li>Logo URL, screenshots, who it&apos;s for, not for you if</li>
          <li>Rating and last reviewed date</li>
        </ul>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export function useAssistantPageContext(pathname: string | null): string | undefined {
  const [context, setContext] = useState<string | undefined>();

  useEffect(() => {
    if (!pathname?.startsWith("/admin")) {
      setContext(undefined);
      return;
    }

    let cancelled = false;

    async function load() {
      const toolMatch = pathname!.match(/^\/admin\/tools\/([^/]+)$/);
      if (toolMatch && toolMatch[1] !== "new") {
        try {
          const res = await fetch(`/api/admin/tools/${toolMatch[1]}`);
          if (res.ok) {
            const tool = (await res.json()) as {
              name?: string;
              slug?: string;
              published?: boolean;
              category?: string;
            };
            if (!cancelled) {
              setContext(
                `User is editing tool "${tool.name ?? "unknown"}" (slug: ${tool.slug}, ${tool.published ? "published" : "draft"}, category: ${tool.category ?? "—"})`
              );
            }
            return;
          }
        } catch {
          /* fall through */
        }
      }

      const affiliateMatch = pathname!.match(/^\/admin\/affiliates\/([^/]+)$/);
      if (affiliateMatch) {
        try {
          const res = await fetch(`/api/admin/affiliates/${affiliateMatch[1]}`);
          if (res.ok) {
            const program = (await res.json()) as {
              companyName?: string;
              status?: string;
              nextFollowUpAt?: string | null;
            };
            if (!cancelled) {
              const due = program.nextFollowUpAt
                ? new Date(program.nextFollowUpAt).toISOString().slice(0, 10)
                : "none scheduled";
              setContext(
                `User is viewing affiliate "${program.companyName ?? "unknown"}" (status: ${program.status ?? "—"}, follow-up: ${due})`
              );
            }
            return;
          }
        } catch {
          /* fall through */
        }
      }

      if (!cancelled) {
        const labels: Record<string, string> = {
          "/admin": "Dashboard",
          "/admin/tools": "Tools list",
          "/admin/affiliates": "Affiliate CRM list",
          "/admin/analytics": "Analytics",
          "/admin/blog": "Blog list",
          "/admin/agent": "Assistant full page",
        };
        setContext(labels[pathname!] ? `User is on ${labels[pathname!]}` : `User is on ${pathname}`);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return context;
}

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
              listingType?: string;
              affiliateUrl?: string | null;
              portalUrl?: string | null;
            };
            if (!cancelled) {
              const listing =
                tool.listingType === "AFFILIATE" ? "affiliate partner" : "editorial pick";
              setContext(
                `User is editing tool "${tool.name ?? "unknown"}" (slug: ${tool.slug}, ${tool.published ? "published" : "draft"}, ${listing}, category: ${tool.category ?? "—"}${tool.affiliateUrl ? ", has tracking URL" : ""})`
              );
            }
            return;
          }
        } catch {
          /* fall through */
        }
      }

      const blogMatch = pathname!.match(/^\/admin\/blog\/([^/]+)$/);
      if (blogMatch) {
        try {
          const res = await fetch(`/api/admin/blog/${blogMatch[1]}`);
          if (res.ok) {
            const post = (await res.json()) as {
              title?: string;
              slug?: string;
              published?: boolean;
            };
            if (!cancelled) {
              setContext(
                `User is editing blog post "${post.title ?? "unknown"}" (slug: ${post.slug}, ${post.published ? "published" : "draft"}) — use update_blog_post or publish_blog`
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
              portalUrl?: string | null;
              signupUrl?: string | null;
            };
            if (!cancelled) {
              const due = program.nextFollowUpAt
                ? new Date(program.nextFollowUpAt).toISOString().slice(0, 10)
                : "none scheduled";
              const portal = program.portalUrl?.trim() ? "has dashboard link" : "missing dashboard link";
              setContext(
                `User is viewing affiliate CRM "${program.companyName ?? "unknown"}" (status: ${program.status ?? "—"}, follow-up: ${due}, ${portal})`
              );
            }
            return;
          }
        } catch {
          /* fall through */
        }
      }

      if (pathname === "/admin/affiliate-directory") {
        if (!cancelled) {
          setContext(
            "User is on Affiliate directory — ACTIVE partners only; bookmark portalUrl dashboard logins and tracking links"
          );
        }
        return;
      }

      if (!cancelled) {
        const labels: Record<string, string> = {
          "/admin": "Dashboard",
          "/admin/tools": "Tools list",
          "/admin/affiliates": "Affiliate CRM list",
          "/admin/affiliate-directory": "Affiliate directory (active partners)",
          "/admin/analytics": "Analytics",
          "/admin/blog": "Blog list — use list_blog_posts, create_blog_draft, update_blog_post",
          "/admin/finances": "Finances — use create_finance_entry, list_finance_entries, get_finance_summary",
          "/admin/tasks": "Tasks board — use list_tasks, create_task, update_task",
          "/admin/playbook":
            "Playbook — reusable Q&A for affiliate forms and emails; use search_playbook with natural language",
          "/admin/subscribers": "Mailing list (read-only via assistant)",
          "/admin/categories": "Categories — use list_categories, create_category",
          "/admin/team": "Team page — use list_team_members for assignments",
          "/admin/hosting": "Hosting & deploy status (view in UI; no assistant tool yet)",
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

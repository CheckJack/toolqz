import { patchAffiliateWithActivity } from "@/lib/affiliate-db";
import { assertCanPatchAffiliate } from "@/lib/affiliate-access";
import { logAudit } from "@/lib/audit-log";
import { buildBlogData, serializeBlogPost } from "@/lib/blog-payload";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { saveAgentToolDraft } from "./create-tool";
import {
  cardFromConfirmation,
  cardsFromAuditLog,
  cardsFromBlogList,
  cardsFromFinance,
  cardsFromMyWork,
  cardsFromSubscribers,
  cardsFromToolIssues,
  type AssistantCard,
} from "./assistant-cards";
import { getAgentFinanceSummary } from "./finance-summary";
import { getMyWorkSummary } from "./my-work";
import { researchToolDraft } from "./tool-research";
import { getToolIssuesSummary } from "./tool-issues";
import type { AgentExecutionContext, AgentToolName } from "./definitions";

async function findTool(args: Record<string, unknown>) {
  const id = typeof args.tool_id === "string" ? args.tool_id.trim() : "";
  const slug = typeof args.tool_slug === "string" ? args.tool_slug.trim() : "";
  const name = typeof args.tool_name === "string" ? args.tool_name.trim() : "";

  if (id) return prisma.tool.findUnique({ where: { id } });
  if (slug) return prisma.tool.findUnique({ where: { slug } });
  if (name) {
    return prisma.tool.findFirst({
      where: { name: { contains: name } },
      orderBy: { name: "asc" },
    });
  }
  return null;
}

async function findAffiliate(args: Record<string, unknown>) {
  const id = typeof args.affiliate_id === "string" ? args.affiliate_id.trim() : "";
  const companyName =
    typeof args.company_name === "string" ? args.company_name.trim() : "";

  if (id) {
    return prisma.affiliateProgram.findUnique({ where: { id } });
  }
  if (companyName) {
    return prisma.affiliateProgram.findFirst({
      where: { companyName: { contains: companyName } },
      orderBy: { companyName: "asc" },
    });
  }
  return null;
}

async function findBlog(args: Record<string, unknown>) {
  const id = typeof args.post_id === "string" ? args.post_id.trim() : "";
  const slug = typeof args.post_slug === "string" ? args.post_slug.trim() : "";
  const title = typeof args.post_title === "string" ? args.post_title.trim() : "";

  if (id) return prisma.blogPost.findUnique({ where: { id } });
  if (slug) return prisma.blogPost.findUnique({ where: { slug } });
  if (title) {
    return prisma.blogPost.findFirst({
      where: { title: { contains: title } },
      orderBy: { updatedAt: "desc" },
    });
  }
  return null;
}

function needsConfirmation(
  confirm: unknown,
  preview: Record<string, unknown>
): { needsConfirmation: true } & Record<string, unknown> | null {
  if (confirm === true) return null;
  return { needsConfirmation: true, ...preview };
}

function toSessionUser(ctx: AgentExecutionContext): SessionUser {
  return { id: ctx.userId, role: ctx.role, email: "", name: "" };
}

export async function executeExtendedAgentTool(
  name: AgentToolName,
  args: Record<string, unknown>,
  ctx: AgentExecutionContext
): Promise<{ result: unknown; links?: { label: string; href: string }[]; cards?: AssistantCard[] }> {
  if (name === "create_tools") {
    const raw = args.urls;
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new Error("create_tools requires a urls array");
    }
    const urls = raw.map((u) => String(u).trim()).filter(Boolean).slice(0, 5);
    const created: { name: string; slug: string; editUrl: string }[] = [];
    const errors: string[] = [];

    for (const url of urls) {
      try {
        const { draft } = await researchToolDraft({ url });
        const tool = await saveAgentToolDraft(draft, ctx.userId);
        created.push({
          name: tool.name,
          slug: tool.slug,
          editUrl: `/admin/tools/${tool.id}`,
        });
      } catch (error) {
        errors.push(`${url}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }

    return {
      result: { success: created.length > 0, created: created.length, tools: created, errors },
      links: created.map((t) => ({ label: t.name, href: t.editUrl })),
    };
  }

  if (name === "get_my_work") {
    const summary = await getMyWorkSummary(ctx.userId);
    return {
      result: summary,
      cards: cardsFromMyWork(summary),
      links: [{ label: "Dashboard", href: "/admin" }],
    };
  }

  if (name === "get_tool_issues") {
    const summary = await getToolIssuesSummary();
    return {
      result: summary,
      cards: cardsFromToolIssues(summary),
      links: [{ label: "Tools", href: "/admin/tools" }],
    };
  }

  if (name === "feature_tool") {
    const tool = await findTool(args);
    if (!tool) throw new Error("Tool not found — provide tool_slug, tool_name, or tool_id");

    const featured = args.featured !== false;
    const action = featured ? "feature" : "unfeature";
    const preview = needsConfirmation(args.confirm, {
      action,
      tool: { id: tool.id, name: tool.name, slug: tool.slug, currentlyFeatured: tool.featured },
      message: featured
        ? `"${tool.name}" will appear in featured sections on the site.`
        : `"${tool.name}" will be removed from featured sections.`,
    });
    if (preview) {
      return { result: preview, cards: [cardFromConfirmation(preview)] };
    }

    if (tool.featured === featured) {
      return { result: { success: true, alreadyInState: true, name: tool.name, featured } };
    }

    const updated = await prisma.tool.update({
      where: { id: tool.id },
      data: { featured },
    });

    await logAudit(
      featured ? "feature" : "unfeature",
      "tool",
      `${featured ? "Featured" : "Unfeatured"} "${updated.name}" via assistant`,
      { userId: ctx.userId, entityId: updated.id }
    );

    return {
      result: { success: true, name: updated.name, slug: updated.slug, featured },
      links: [{ label: updated.name, href: `/admin/tools/${updated.id}` }],
    };
  }

  if (name === "list_categories") {
    const search = typeof args.search === "string" ? args.search.trim() : "";
    const limit = Math.min(50, Math.max(1, Number(args.limit) || 30));
    const where = search
      ? {
          OR: [
            { label: { contains: search } },
            { slug: { contains: search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.toolCategory.findMany({
        where,
        select: { slug: true, label: true, description: true, published: true },
        orderBy: { sortOrder: "asc" },
        take: limit,
      }),
      prisma.toolCategory.count({ where }),
    ]);

    return {
      result: { total, showing: items.length, categories: items },
      cards: [
        {
          type: "ranked_list",
          title: "Categories",
          items: items.map((c) => ({
            label: c.label,
            hint: c.slug,
            value: c.published ? "live" : "hidden",
          })),
        },
      ],
      links: [{ label: "Manage categories", href: "/admin/categories" }],
    };
  }

  if (name === "list_blog_posts") {
    const search = typeof args.search === "string" ? args.search.trim() : "";
    const published = typeof args.published === "boolean" ? args.published : undefined;
    const limit = Math.min(30, Math.max(1, Number(args.limit) || 15));

    const where = {
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
      ...(published === true ? { published: true } : published === false ? { published: false } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: { id: true, title: true, slug: true, published: true },
        orderBy: { updatedAt: "desc" },
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    const posts = items.map((p) => ({
      title: p.title,
      slug: p.slug,
      published: p.published,
      editUrl: `/admin/blog/${p.id}`,
    }));

    return {
      result: { total, showing: items.length, posts },
      cards: cardsFromBlogList({ total, showing: items.length, posts }),
      links: [{ label: "Blog", href: "/admin/blog" }],
    };
  }

  if (name === "publish_blog") {
    const post = await findBlog(args);
    if (!post) throw new Error("Blog post not found — provide post_id, post_slug, or post_title");

    const published = args.published !== false;
    const action = published ? "publish_blog" : "unpublish_blog";
    const preview = needsConfirmation(args.confirm, {
      action,
      post: { id: post.id, title: post.title, slug: post.slug, currentlyPublished: post.published },
      message: published
        ? `"${post.title}" will be visible on the public blog.`
        : `"${post.title}" will be hidden from the public blog.`,
    });
    if (preview) {
      return { result: preview, cards: [cardFromConfirmation(preview)] };
    }

    if (post.published === published) {
      return { result: { success: true, alreadyInState: true, title: post.title, published } };
    }

    const data = buildBlogData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      published,
      authorId: post.authorId,
      existingPublishedAt: post.publishedAt,
    });

    const updated = await prisma.blogPost.update({
      where: { id: post.id },
      data,
      include: { author: { select: { name: true } } },
    });

    await logAudit(
      published ? "publish" : "unpublish",
      "blog_post",
      `${published ? "Published" : "Unpublished"} "${updated.title}" via assistant`,
      { userId: ctx.userId, entityId: updated.id }
    );

    const serialized = serializeBlogPost(updated);
    return {
      result: { success: true, title: serialized.title, slug: serialized.slug, published },
      links: [{ label: serialized.title, href: `/admin/blog/${updated.id}` }],
    };
  }

  if (name === "update_affiliate") {
    const affiliate = await findAffiliate(args);
    if (!affiliate) {
      throw new Error("Affiliate not found — provide affiliate_id or company_name");
    }

    const session = toSessionUser(ctx);
    const patch: Record<string, unknown> = {};

    if (typeof args.status === "string" && args.status.trim()) {
      patch.status = args.status.trim();
    }
    if (typeof args.notes === "string") {
      patch.notes = args.notes.trim() || null;
    }
    if (typeof args.next_follow_up === "string" && args.next_follow_up.trim()) {
      const d = new Date(args.next_follow_up.trim());
      if (Number.isNaN(d.getTime())) throw new Error("Invalid next_follow_up date — use YYYY-MM-DD");
      patch.nextFollowUpAt = d.toISOString();
    }
    if (args.assigned_to_me === true) {
      patch.assignedToId = ctx.userId;
    }

    if (Object.keys(patch).length === 0) {
      throw new Error("Provide at least one field to update: status, notes, next_follow_up, or assigned_to_me");
    }

    assertCanPatchAffiliate(session, affiliate, patch);
    const updated = await patchAffiliateWithActivity(affiliate.id, patch, session);
    if (!updated) throw new Error("Failed to update affiliate");

    return {
      result: {
        success: true,
        companyName: updated.companyName,
        status: updated.status,
        nextFollowUpAt: updated.nextFollowUpAt?.toISOString().slice(0, 10) ?? null,
      },
      links: [{ label: updated.companyName, href: `/admin/affiliates/${updated.id}` }],
    };
  }

  if (name === "get_finance_summary") {
    const summary = await getAgentFinanceSummary();
    return {
      result: summary,
      cards: cardsFromFinance(summary),
      links: [{ label: "Finances", href: "/admin/finances" }],
    };
  }

  if (name === "search_audit_log") {
    const search = typeof args.search === "string" ? args.search.trim() : "";
    const entity = typeof args.entity === "string" ? args.entity.trim() : "";
    const limit = Math.min(30, Math.max(1, Number(args.limit) || 15));

    const where = {
      ...(search ? { detail: { contains: search } } : {}),
      ...(entity ? { entity } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    const entries = items.map((e) => ({
      action: e.action,
      entity: e.entity,
      detail: e.detail ?? "",
      user: e.user?.name ?? e.user?.email ?? "—",
      at: e.createdAt.toISOString().slice(0, 16).replace("T", " "),
    }));

    return {
      result: { total, showing: items.length, entries },
      cards: cardsFromAuditLog({ total, showing: items.length, entries }),
      links: [{ label: "Full audit log", href: "/admin/audit" }],
    };
  }

  if (name === "list_subscribers") {
    const status =
      typeof args.status === "string" && args.status.trim()
        ? args.status.trim()
        : "ACTIVE";
    const limit = Math.min(30, Math.max(1, Number(args.limit) || 15));

    const where = { status };
    const [items, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        select: { email: true, name: true, status: true, subscribedAt: true },
        orderBy: { subscribedAt: "desc" },
        take: limit,
      }),
      prisma.newsletterSubscriber.count({ where }),
    ]);

    const subscribers = items.map((s) => ({
      email: s.email,
      name: s.name ?? "—",
      subscribedAt: s.subscribedAt.toISOString().slice(0, 10),
    }));

    return {
      result: { total, showing: items.length, subscribers },
      cards: cardsFromSubscribers({ total, showing: items.length, subscribers }),
      links: [{ label: "Mailing list", href: "/admin/subscribers" }],
    };
  }

  throw new Error(`Unknown extended agent tool: ${name}`);
}

export const EXTENDED_AGENT_TOOLS = new Set<AgentToolName>([
  "create_tools",
  "get_my_work",
  "get_tool_issues",
  "feature_tool",
  "list_categories",
  "list_blog_posts",
  "publish_blog",
  "update_affiliate",
  "get_finance_summary",
  "search_audit_log",
  "list_subscribers",
]);

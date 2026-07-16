import {
  createAffiliateForAgent,
  findAffiliateForAgent,
} from "./affiliate-agent";
import { assertUniqueMatch } from "./entity-resolve";
import { patchAffiliateWithActivity } from "@/lib/affiliate-db";
import { assertCanPatchAffiliate } from "@/lib/affiliate-access";
import { logAudit } from "@/lib/audit-log";
import { buildBlogData, serializeBlogPost } from "@/lib/blog-payload";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { saveAgentToolDraft } from "./create-tool";
import { maskSubscriberEmail } from "./catalog-filters";
import { needsConfirmationWithToken } from "./confirm-flow";
import {
  cardFromConfirmation,
  cardsFromAffiliateDirectory,
  cardsFromAuditLog,
  cardsFromBlogList,
  cardsFromFinance,
  cardsFromFinanceEntries,
  cardsFromMyWork,
  cardsFromPlaybook,
  cardsFromSubscribers,
  cardsFromTasks,
  cardsFromTeamMembers,
  cardsFromToolIssues,
  type AssistantCard,
} from "./assistant-cards";
import { getAgentFinanceSummary } from "./finance-summary";
import { getMyWorkSummary } from "./my-work";
import {
  createAdminTaskForAgent,
  findAdminTask,
  listAdminTasksForAgent,
  updateAdminTaskForAgent,
} from "./task-agent";
import {
  createPlaybookSnippetForAgent,
  findPlaybookSnippet,
  searchPlaybookForAgent,
  updatePlaybookSnippetForAgent,
} from "./playbook-agent";
import {
  createNoteForAgent,
  deleteNoteForAgent,
  getNoteForAgent,
  listNotesForAgent,
  updateNoteForAgent,
} from "./notes-agent";
import { researchToolDraft } from "./tool-research";
import { getToolIssuesSummary } from "./tool-issues";
import type { AgentExecutionContext, AgentToolName } from "./definitions";
import { isFinanceType, parseFinanceAmount, DEFAULT_CURRENCY } from "@/lib/finance";

async function findTool(args: Record<string, unknown>) {
  const id = typeof args.tool_id === "string" ? args.tool_id.trim() : "";
  const slug = typeof args.tool_slug === "string" ? args.tool_slug.trim() : "";
  const name = typeof args.tool_name === "string" ? args.tool_name.trim() : "";

  if (id) return prisma.tool.findUnique({ where: { id } });
  if (slug) return prisma.tool.findUnique({ where: { slug } });
  if (name) {
    const rows = await prisma.tool.findMany({
      where: { name: { contains: name } },
      orderBy: { name: "asc" },
      take: 6,
    });
    return assertUniqueMatch(rows, name, (r) => r.name, "tool");
  }
  return null;
}

async function findAffiliate(args: Record<string, unknown>) {
  return findAffiliateForAgent(args);
}

async function findBlog(args: Record<string, unknown>) {
  const id = typeof args.post_id === "string" ? args.post_id.trim() : "";
  const slug = typeof args.post_slug === "string" ? args.post_slug.trim() : "";
  const title = typeof args.post_title === "string" ? args.post_title.trim() : "";

  if (id) return prisma.blogPost.findUnique({ where: { id } });
  if (slug) return prisma.blogPost.findUnique({ where: { slug } });
  if (title) {
    const rows = await prisma.blogPost.findMany({
      where: { title: { contains: title } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    });
    return assertUniqueMatch(rows, title, (r) => r.title, "blog post");
  }
  return null;
}

async function findFinanceEntry(args: Record<string, unknown>) {
  const id = typeof args.entry_id === "string" ? args.entry_id.trim() : "";
  const match =
    typeof args.match_description === "string" ? args.match_description.trim() : "";

  if (id) return prisma.financeEntry.findUnique({ where: { id } });
  if (match) {
    const rows = await prisma.financeEntry.findMany({
      where: { description: { contains: match } },
      orderBy: { occurredAt: "desc" },
      take: 6,
    });
    return assertUniqueMatch(rows, match, (r) => r.description, "finance entry");
  }
  return null;
}

function needsConfirmation(
  userId: string,
  tool: AgentToolName,
  args: Record<string, unknown>,
  confirm: unknown,
  preview: Record<string, unknown>
) {
  return needsConfirmationWithToken(userId, tool, args, confirm, preview);
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
      links: [
        { label: "Tasks", href: "/admin/tasks" },
        { label: "Dashboard", href: "/admin" },
      ],
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
    const preview = needsConfirmation(ctx.userId, "feature_tool", args, args.confirm, {
      action,
      tool: { id: tool.id, name: tool.name, slug: tool.slug, currentlyFeatured: tool.featured },
      message: featured
        ? `"${tool.name}" will appear in featured sections on the site.`
        : `"${tool.name}" will be removed from featured sections.`,
    });
    if (preview) {
      return { result: preview, cards: [cardFromConfirmation(preview, preview.confirmationToken)] };
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
    const preview = needsConfirmation(ctx.userId, "publish_blog", args, args.confirm, {
      action,
      post: { id: post.id, title: post.title, slug: post.slug, currentlyPublished: post.published },
      message: published
        ? `"${post.title}" will be visible on the public blog.`
        : `"${post.title}" will be hidden from the public blog.`,
    });
    if (preview) {
      return { result: preview, cards: [cardFromConfirmation(preview, preview.confirmationToken)] };
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

  if (name === "update_blog_post") {
    const post = await findBlog(args);
    if (!post) {
      throw new Error("Blog post not found — provide post_id, post_slug, or post_title");
    }

    const patch: {
      title?: string;
      slug?: string;
      excerpt?: string | null;
      content?: string;
      coverImage?: string | null;
    } = {};

    if (typeof args.title === "string" && args.title.trim()) patch.title = args.title.trim();
    if (typeof args.slug === "string" && args.slug.trim()) patch.slug = args.slug.trim();
    if (typeof args.excerpt === "string") patch.excerpt = args.excerpt.trim() || null;
    if (typeof args.content === "string" && args.content.trim()) patch.content = args.content.trim();
    if (typeof args.cover_image === "string") {
      patch.coverImage = args.cover_image.trim() || null;
    }

    if (Object.keys(patch).length === 0) {
      throw new Error(
        "Provide at least one field to update: title, slug, excerpt, content, or cover_image"
      );
    }

    if (patch.slug && patch.slug !== post.slug) {
      const conflict = await prisma.blogPost.findFirst({
        where: { slug: patch.slug, NOT: { id: post.id } },
      });
      if (conflict) throw new Error(`Slug "${patch.slug}" is already in use`);
    }

    const data = buildBlogData({
      title: patch.title ?? post.title,
      slug: patch.slug ?? post.slug,
      excerpt: patch.excerpt !== undefined ? (patch.excerpt ?? "") : (post.excerpt ?? ""),
      content: patch.content ?? post.content,
      coverImage: patch.coverImage !== undefined ? patch.coverImage : post.coverImage,
      published: post.published,
      authorId: post.authorId,
      existingPublishedAt: post.publishedAt,
    });

    const updated = await prisma.blogPost.update({
      where: { id: post.id },
      data,
      include: { author: { select: { name: true } } },
    });

    await logAudit("update", "blog_post", `Assistant updated "${updated.title}"`, {
      userId: ctx.userId,
      entityId: updated.id,
    });

    const serialized = serializeBlogPost(updated);
    return {
      result: { success: true, title: serialized.title, slug: serialized.slug, published: serialized.published },
      links: [{ label: serialized.title, href: `/admin/blog/${updated.id}` }],
    };
  }

  if (name === "delete_blog_post") {
    const post = await findBlog(args);
    if (!post) {
      throw new Error("Blog post not found — provide post_id, post_slug, or post_title");
    }

    const preview = needsConfirmation(ctx.userId, "delete_blog_post", args, args.confirm, {
      action: "delete",
      post: { id: post.id, title: post.title, slug: post.slug },
      message: `This permanently deletes the blog post "${post.title}".`,
    });
    if (preview) {
      return { result: preview, cards: [cardFromConfirmation(preview, preview.confirmationToken)] };
    }

    await prisma.blogPost.delete({ where: { id: post.id } });
    await logAudit("delete", "blog_post", `Assistant deleted "${post.title}"`, {
      userId: ctx.userId,
      entityId: post.id,
    });

    return {
      result: { success: true, deleted: post.title },
      links: [{ label: "Blog", href: "/admin/blog" }],
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
    if (typeof args.portal_url === "string") {
      patch.portalUrl = args.portal_url.trim() || null;
    }
    if (typeof args.signup_url === "string") {
      patch.signupUrl = args.signup_url.trim() || null;
    }
    if (typeof args.affiliate_url === "string") {
      patch.affiliateUrl = args.affiliate_url.trim() || null;
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
      throw new Error(
        "Provide at least one field: status, notes, next_follow_up, assigned_to_me, portal_url, signup_url, or affiliate_url"
      );
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

  if (name === "create_affiliate") {
    const affiliate = await createAffiliateForAgent(args, ctx.userId);
    await logAudit("create", "affiliate", `Assistant created program "${affiliate.companyName}"`, {
      userId: ctx.userId,
      entityId: affiliate.id,
    });
    return {
      result: { success: true, ...affiliate },
      links: [{ label: affiliate.companyName, href: affiliate.editUrl }],
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
      email: maskSubscriberEmail(s.email),
      name: s.name ?? "—",
      subscribedAt: s.subscribedAt.toISOString().slice(0, 10),
    }));

    return {
      result: { total, showing: items.length, subscribers },
      cards: cardsFromSubscribers({ total, showing: items.length, subscribers }),
      links: [{ label: "Mailing list", href: "/admin/subscribers" }],
    };
  }

  if (name === "list_affiliate_directory") {
    const search = typeof args.search === "string" ? args.search.trim() : "";
    const missingPortal = args.missing_portal === true;
    const limit = Math.min(30, Math.max(1, Number(args.limit) || 15));

    const where = {
      status: "ACTIVE",
      ...(search ? { companyName: { contains: search } } : {}),
      ...(missingPortal
        ? {
            OR: [{ portalUrl: null }, { portalUrl: "" }],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.affiliateProgram.findMany({
        where,
        select: {
          id: true,
          companyName: true,
          status: true,
          toolId: true,
          portalUrl: true,
        },
        orderBy: { companyName: "asc" },
        take: limit,
      }),
      prisma.affiliateProgram.count({ where }),
    ]);

    const programs = items.map((a) => ({
      companyName: a.companyName,
      status: a.status,
      hasTool: !!a.toolId,
      hasPortal: Boolean(a.portalUrl?.trim()),
      editUrl: `/admin/affiliates/${a.id}`,
      directoryUrl: "/admin/affiliate-directory",
    }));

    return {
      result: { total, showing: items.length, programs },
      cards: cardsFromAffiliateDirectory({ total, showing: items.length, programs }),
      links: [{ label: "Affiliate directory", href: "/admin/affiliate-directory" }],
    };
  }

  if (name === "list_tasks") {
    const result = await listAdminTasksForAgent(args, ctx.userId);
    return {
      result,
      cards: cardsFromTasks(result),
      links: [{ label: "Tasks board", href: "/admin/tasks" }],
    };
  }

  if (name === "create_task") {
    const task = await createAdminTaskForAgent(args, ctx.userId);
    await logAudit("create", "task", `Assistant created task "${task.title}"`, {
      userId: ctx.userId,
      entityId: task.id,
    });
    return {
      result: { success: true, task },
      links: [{ label: task.title, href: "/admin/tasks" }],
    };
  }

  if (name === "update_task") {
    const task = await updateAdminTaskForAgent(args, ctx.userId);
    await logAudit("update", "task", `Assistant updated task "${task.title}"`, {
      userId: ctx.userId,
      entityId: task.id,
    });
    return {
      result: { success: true, task },
      links: [{ label: task.title, href: "/admin/tasks" }],
    };
  }

  if (name === "delete_task") {
    const task = await findAdminTask(args);
    if (!task) throw new Error("Task not found — provide task_id or task_title");

    const preview = needsConfirmation(ctx.userId, "delete_task", args, args.confirm, {
      action: "delete",
      task: { id: task.id, title: task.title, status: task.status },
      message: `This permanently deletes the task "${task.title}".`,
    });
    if (preview) {
      return {
        result: preview,
        cards: [cardFromConfirmation(preview, preview.confirmationToken)],
      };
    }

    await prisma.adminTask.delete({ where: { id: task.id } });
    await logAudit("delete", "task", `Assistant deleted task "${task.title}"`, {
      userId: ctx.userId,
      entityId: task.id,
    });

    return {
      result: { success: true, deleted: task.title },
      links: [{ label: "Tasks", href: "/admin/tasks" }],
    };
  }

  if (name === "create_finance_entry") {
    const type = typeof args.type === "string" ? args.type.trim().toUpperCase() : "";
    if (!isFinanceType(type)) throw new Error("type must be EARNING or EXPENSE");

    const amount = parseFinanceAmount(args.amount);
    if (amount === null) throw new Error("amount is required");

    const description = typeof args.description === "string" ? args.description.trim() : "";
    if (!description) throw new Error("description is required");

    const source = typeof args.source === "string" ? args.source.trim() || null : null;
    const notes = typeof args.notes === "string" ? args.notes.trim() || null : null;
    const occurredAtRaw = typeof args.occurred_at === "string" ? args.occurred_at.trim() : "";
    const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date();
    if (Number.isNaN(occurredAt.getTime())) throw new Error("Invalid occurred_at date");

    const entry = await prisma.financeEntry.create({
      data: {
        type,
        amount,
        currency: DEFAULT_CURRENCY,
        description,
        source,
        notes,
        occurredAt,
        createdById: ctx.userId,
      },
    });

    await logAudit("create", "finance", `Assistant added ${type.toLowerCase()}: ${description}`, {
      userId: ctx.userId,
      entityId: entry.id,
    });

    return {
      result: {
        success: true,
        id: entry.id,
        type: entry.type,
        amount: entry.amount,
        description: entry.description,
      },
      links: [{ label: "Finances", href: "/admin/finances" }],
    };
  }

  if (name === "list_finance_entries") {
    const type = typeof args.type === "string" ? args.type.trim().toUpperCase() : "";
    const search = typeof args.search === "string" ? args.search.trim() : "";
    const limit = Math.min(30, Math.max(1, Number(args.limit) || 15));

    const where = {
      ...(type && isFinanceType(type) ? { type } : {}),
      ...(search
        ? {
            OR: [{ description: { contains: search } }, { source: { contains: search } }],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.financeEntry.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        take: limit,
        select: {
          type: true,
          amount: true,
          description: true,
          occurredAt: true,
        },
      }),
      prisma.financeEntry.count({ where }),
    ]);

    const entries = items.map((e) => ({
      type: e.type,
      amount: e.amount,
      description: e.description,
      occurredAt: e.occurredAt.toISOString().slice(0, 10),
    }));

    return {
      result: { total, showing: items.length, entries },
      cards: cardsFromFinanceEntries({ total, showing: items.length, entries }),
      links: [{ label: "Finances", href: "/admin/finances" }],
    };
  }

  if (name === "update_finance_entry") {
    const entry = await findFinanceEntry(args);
    if (!entry) {
      throw new Error("Finance entry not found — provide entry_id or match_description");
    }

    const data: {
      type?: string;
      amount?: number;
      description?: string;
      source?: string | null;
      notes?: string | null;
      occurredAt?: Date;
    } = {};

    if (args.type !== undefined) {
      const type = typeof args.type === "string" ? args.type.trim().toUpperCase() : "";
      if (!isFinanceType(type)) throw new Error("type must be EARNING or EXPENSE");
      data.type = type;
    }

    if (args.amount !== undefined) {
      const amount = parseFinanceAmount(args.amount);
      if (amount === null) throw new Error("amount must be greater than zero");
      data.amount = amount;
    }

    if (args.description !== undefined) {
      const description = typeof args.description === "string" ? args.description.trim() : "";
      if (!description) throw new Error("description cannot be empty");
      data.description = description;
    }

    if (args.source !== undefined) {
      data.source = typeof args.source === "string" ? args.source.trim() || null : null;
    }

    if (args.notes !== undefined) {
      data.notes = typeof args.notes === "string" ? args.notes.trim() || null : null;
    }

    if (typeof args.occurred_at === "string" && args.occurred_at.trim()) {
      const d = new Date(args.occurred_at.trim());
      if (Number.isNaN(d.getTime())) throw new Error("Invalid occurred_at — use YYYY-MM-DD");
      data.occurredAt = d;
    }

    if (Object.keys(data).length === 0) {
      throw new Error(
        "Provide at least one field: type, amount, description, source, notes, or occurred_at"
      );
    }

    const updated = await prisma.financeEntry.update({
      where: { id: entry.id },
      data,
    });

    await logAudit("update", "finance", `Assistant updated finance entry "${updated.description}"`, {
      userId: ctx.userId,
      entityId: updated.id,
    });

    return {
      result: {
        success: true,
        id: updated.id,
        type: updated.type,
        amount: updated.amount,
        description: updated.description,
      },
      links: [{ label: "Finances", href: "/admin/finances" }],
    };
  }

  if (name === "delete_finance_entry") {
    const entry = await findFinanceEntry(args);
    if (!entry) {
      throw new Error("Finance entry not found — provide entry_id or match_description");
    }

    const preview = needsConfirmation(ctx.userId, "delete_finance_entry", args, args.confirm, {
      action: "delete",
      entry: { id: entry.id, description: entry.description, amount: entry.amount, type: entry.type },
      message: `This permanently deletes the ${entry.type.toLowerCase()} "${entry.description}" (${entry.amount}).`,
    });
    if (preview) {
      return { result: preview, cards: [cardFromConfirmation(preview, preview.confirmationToken)] };
    }

    await prisma.financeEntry.delete({ where: { id: entry.id } });
    await logAudit("delete", "finance", `Assistant deleted "${entry.description}"`, {
      userId: ctx.userId,
      entityId: entry.id,
    });

    return {
      result: { success: true, deleted: entry.description },
      links: [{ label: "Finances", href: "/admin/finances" }],
    };
  }

  if (name === "list_team_members") {
    const search = typeof args.search === "string" ? args.search.trim() : "";
    const limit = Math.min(30, Math.max(1, Number(args.limit) || 15));

    const where = search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const members = items.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
    }));

    return {
      result: { total, showing: items.length, members },
      cards: cardsFromTeamMembers({ total, showing: items.length, members }),
      links: [{ label: "Team", href: "/admin/team" }],
    };
  }

  if (name === "list_notes") {
    const result = await listNotesForAgent(args, ctx.userId);
    return {
      result,
      cards: [
        {
          type: "alert",
          variant: "info",
          title: `${result.count} notes`,
          message:
            result.notes
              .map(
                (n) =>
                  `• ${n.title} [${n.visibility}]${n.pinned ? " 📌" : ""} — ${n.createdBy}`
              )
              .join("\n") || "No notes found.",
        },
      ],
      links: [{ label: "Notes", href: "/admin/notes" }],
    };
  }

  if (name === "get_note") {
    const result = await getNoteForAgent(args, ctx.userId);
    const note = result.note;
    return {
      result,
      cards: [
        {
          type: "alert",
          variant: "info",
          title: note.title,
          message: `${note.visibility} · by ${note.createdBy.name}\nLinks: ${note.links.length} · Files: ${note.attachments.length}`,
        },
      ],
      links: [{ label: note.title, href: "/admin/notes" }],
    };
  }

  if (name === "create_note") {
    const result = await createNoteForAgent(args, ctx.userId);
    await logAudit("create", "admin_note", `Assistant created note "${result.note.title}"`, {
      userId: ctx.userId,
      entityId: result.note.id,
    });
    return {
      result,
      links: [{ label: result.note.title, href: "/admin/notes" }],
    };
  }

  if (name === "update_note") {
    const result = await updateNoteForAgent(args, ctx.userId, ctx.role);
    await logAudit("update", "admin_note", `Assistant updated note "${result.note.title}"`, {
      userId: ctx.userId,
      entityId: result.note.id,
    });
    return {
      result: { success: true, note: result.note },
      links: [{ label: result.note.title, href: "/admin/notes" }],
    };
  }

  if (name === "delete_note") {
    const previewNote = await getNoteForAgent(args, ctx.userId).catch(() => null);
    const title = previewNote?.note.title ?? "this note";
    const preview = needsConfirmationWithToken(
      ctx.userId,
      "delete_note",
      args,
      args.confirm,
      {
        action: "delete",
        name: title,
        tool: { name: title },
        message: `This permanently deletes the note "${title}" and its attachments.`,
      }
    );
    if (preview) {
      return {
        result: preview,
        cards: [cardFromConfirmation(preview, preview.confirmationToken)],
      };
    }
    const result = await deleteNoteForAgent(args, ctx.userId, ctx.role);
    await logAudit("delete", "admin_note", `Assistant deleted note "${result.title}"`, {
      userId: ctx.userId,
      entityId: result.id,
    });
    return {
      result,
      links: [{ label: "Notes", href: "/admin/notes" }],
    };
  }

  if (name === "search_playbook") {
    const result = await searchPlaybookForAgent(args);
    return {
      result,
      cards: cardsFromPlaybook(result),
      links: [{ label: "Playbook", href: "/admin/playbook" }],
    };
  }

  if (name === "create_playbook_snippet") {
    const snippet = await createPlaybookSnippetForAgent(args, ctx.userId);
    await logAudit("create", "playbook", `Assistant added playbook "${snippet.question}"`, {
      userId: ctx.userId,
      entityId: snippet.id,
    });
    return {
      result: { success: true, snippet },
      links: [{ label: snippet.question, href: "/admin/playbook" }],
    };
  }

  if (name === "update_playbook_snippet") {
    const snippet = await updatePlaybookSnippetForAgent(args);
    await logAudit("update", "playbook", `Assistant updated playbook "${snippet.question}"`, {
      userId: ctx.userId,
      entityId: snippet.id,
    });
    return {
      result: { success: true, snippet },
      links: [{ label: snippet.question, href: "/admin/playbook" }],
    };
  }

  if (name === "delete_playbook_snippet") {
    const snippet = await findPlaybookSnippet(args);
    if (!snippet) {
      throw new Error("Playbook snippet not found — provide snippet_id or snippet_question");
    }

    const preview = needsConfirmation(ctx.userId, "delete_playbook_snippet", args, args.confirm, {
      action: "delete",
      tool: { name: snippet.question },
      message: `This permanently deletes the playbook snippet "${snippet.question}".`,
    });
    if (preview) {
      return {
        result: preview,
        cards: [cardFromConfirmation(preview, preview.confirmationToken)],
      };
    }

    await prisma.adminPlaybookSnippet.delete({ where: { id: snippet.id } });
    await logAudit("delete", "playbook", `Assistant deleted playbook "${snippet.question}"`, {
      userId: ctx.userId,
      entityId: snippet.id,
    });

    return {
      result: { success: true, deleted: snippet.question },
      links: [{ label: "Playbook", href: "/admin/playbook" }],
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
  "update_blog_post",
  "delete_blog_post",
  "update_affiliate",
  "create_affiliate",
  "list_affiliate_directory",
  "get_finance_summary",
  "search_audit_log",
  "list_subscribers",
  "list_tasks",
  "create_task",
  "update_task",
  "delete_task",
  "create_finance_entry",
  "list_finance_entries",
  "update_finance_entry",
  "delete_finance_entry",
  "list_team_members",
  "list_notes",
  "get_note",
  "create_note",
  "update_note",
  "delete_note",
  "search_playbook",
  "create_playbook_snippet",
  "update_playbook_snippet",
  "delete_playbook_snippet",
]);

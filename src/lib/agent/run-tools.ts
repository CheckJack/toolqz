import { assertToolCategoryExists, categorySlugify, listToolCategoryFilters } from "@/lib/categories";
import { logAudit } from "@/lib/audit-log";
import { buildBlogData, serializeBlogPost } from "@/lib/blog-payload";
import { prisma } from "@/lib/db";
import { createToolFromAffiliateProgram } from "@/lib/tool-from-affiliate";
import { buildToolData, serializeTool } from "@/lib/tool-payload";
import {
  cardFromConfirmation,
  cardsFromAffiliateList,
  cardsFromAnalytics,
  cardsFromToolList,
  type AssistantCard,
} from "./assistant-cards";
import { getAgentAnalyticsSummary } from "./analytics-summary";
import { researchBlogDraft } from "./blog-research";
import { saveAgentToolDraft } from "./create-tool";
import type { AgentChatResult, AgentExecutionContext, AgentToolName } from "./definitions";
import { researchToolDraft } from "./tool-research";
import { assertAgentToolAccess } from "./tool-access";
import { needsConfirmationWithToken } from "./confirm-flow";
import { assertResearchRateLimit } from "./rate-limit";
import { executeExtendedAgentTool, EXTENDED_AGENT_TOOLS } from "./run-tools-extended";

const toolInclude = {
  _count: { select: { clicks: true } },
  affiliate: { select: { id: true, status: true, companyName: true } },
} as const;

async function findTool(args: Record<string, unknown>) {
  const id = typeof args.tool_id === "string" ? args.tool_id.trim() : "";
  const slug = typeof args.tool_slug === "string" ? args.tool_slug.trim() : "";
  const name = typeof args.tool_name === "string" ? args.tool_name.trim() : "";

  if (id) return prisma.tool.findUnique({ where: { id }, include: toolInclude });
  if (slug) return prisma.tool.findUnique({ where: { slug }, include: toolInclude });
  if (name) {
    return prisma.tool.findFirst({
      where: { name: { contains: name } },
      include: toolInclude,
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
    return prisma.affiliateProgram.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        status: true,
        toolId: true,
        website: true,
        affiliateUrl: true,
      },
    });
  }

  if (companyName) {
    return prisma.affiliateProgram.findFirst({
      where: { companyName: { contains: companyName } },
      select: {
        id: true,
        companyName: true,
        status: true,
        toolId: true,
        website: true,
        affiliateUrl: true,
      },
      orderBy: { companyName: "asc" },
    });
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

export async function executeAgentTool(
  name: AgentToolName,
  args: Record<string, unknown>,
  ctx: AgentExecutionContext
): Promise<{ result: unknown; links?: AgentChatResult["links"]; cards?: AssistantCard[] }> {
  assertAgentToolAccess(name, ctx.role);
  assertResearchRateLimit(ctx.userId, name);

  if (EXTENDED_AGENT_TOOLS.has(name)) {
    return executeExtendedAgentTool(name, args, ctx);
  }

  const userId = ctx.userId;

  if (name === "create_tool") {
    const url = String(args.url ?? "").trim();
    const toolName = typeof args.name === "string" ? args.name.trim() : undefined;
    if (!url) throw new Error("create_tool requires a url");

    const { draft } = await researchToolDraft({ name: toolName, url });
    const tool = await saveAgentToolDraft(draft, userId);

    return {
      result: {
        success: true,
        toolId: tool.id,
        name: tool.name,
        slug: tool.slug,
        editUrl: `/admin/tools/${tool.id}`,
      },
      links: [{ label: `Open draft: ${tool.name}`, href: `/admin/tools/${tool.id}` }],
    };
  }

  if (name === "list_tools") {
    const search = typeof args.search === "string" ? args.search.trim() : "";
    const category = typeof args.category === "string" ? args.category.trim() : "";
    const published = typeof args.published === "boolean" ? args.published : undefined;
    const listingType =
      typeof args.listing_type === "string" && args.listing_type.trim()
        ? args.listing_type.trim().toUpperCase()
        : undefined;
    const featured = typeof args.featured === "boolean" ? args.featured : undefined;
    const limit = Math.min(30, Math.max(1, Number(args.limit) || 15));

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { slug: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
      ...(published === true ? { published: true } : published === false ? { published: false } : {}),
      ...(listingType === "AFFILIATE" || listingType === "EDITORIAL"
        ? { listingType }
        : {}),
      ...(featured === true ? { featured: true } : featured === false ? { featured: false } : {}),
    };

    const [items, total, categories] = await Promise.all([
      prisma.tool.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          published: true,
          featured: true,
          listingType: true,
        },
        orderBy: { name: "asc" },
        take: limit,
      }),
      prisma.tool.count({ where }),
      listToolCategoryFilters(),
    ]);

    const label = (slug: string) => categories.labels[slug] ?? slug;

    const tools = items.map((t) => ({
      name: t.name,
      slug: t.slug,
      category: label(t.category),
      published: t.published,
      listingType: t.listingType,
      editUrl: `/admin/tools/${t.id}`,
    }));

    const result = { total, showing: items.length, tools };

    return {
      result,
      cards: cardsFromToolList({ total, showing: items.length, tools }),
    };
  }

  if (name === "create_category") {
    const label = String(args.label ?? "").trim();
    if (!label) throw new Error("create_category requires a label");

    const slugInput = typeof args.slug === "string" ? args.slug.trim() : "";
    const slug = slugInput ? categorySlugify(slugInput) : categorySlugify(label);
    const description =
      typeof args.description === "string" ? args.description.trim() || null : null;

    const existing = await prisma.toolCategory.findUnique({ where: { slug } });
    if (existing) {
      throw new Error(`Category "${slug}" already exists`);
    }

    const category = await prisma.toolCategory.create({
      data: { slug, label, description, published: true, sortOrder: 0 },
    });

    await logAudit("create", "category", `Agent created category "${category.label}"`, {
      userId,
      entityId: category.id,
    });

    return {
      result: { success: true, slug: category.slug, label: category.label },
      links: [{ label: `Category: ${category.label}`, href: "/admin/categories" }],
    };
  }

  if (name === "create_blog_draft") {
    const topic = String(args.topic ?? "").trim();
    if (!topic) throw new Error("create_blog_draft requires a topic");

    const draft = await researchBlogDraft(topic);
    const conflict = await prisma.blogPost.findUnique({ where: { slug: draft.slug } });
    if (conflict) {
      draft.slug = `${draft.slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const post = await prisma.blogPost.create({
      data: buildBlogData({
        title: draft.title,
        slug: draft.slug,
        excerpt: draft.excerpt,
        content: draft.content,
        coverImage: draft.coverImage,
        published: false,
        authorId: userId,
      }),
      include: { author: { select: { name: true } } },
    });

    await logAudit("create", "blog_post", `Agent created draft blog "${post.title}"`, {
      userId,
      entityId: post.id,
    });

    const serialized = serializeBlogPost(post);
    return {
      result: { success: true, title: serialized.title, slug: serialized.slug },
      links: [{ label: `Open draft: ${serialized.title}`, href: `/admin/blog/${post.id}` }],
    };
  }

  if (name === "update_tool") {
    const tool = await findTool(args);
    if (!tool) {
      throw new Error("Tool not found — provide tool_slug, tool_name, or tool_id");
    }

    const url =
      (typeof args.url === "string" ? args.url.trim() : "") || tool.url;
    const { draft } = await researchToolDraft({ name: tool.name, url });
    await assertToolCategoryExists(draft.category);

    const updated = await prisma.tool.update({
      where: { id: tool.id },
      data: {
        ...buildToolData({
          ...draft,
          slug: tool.slug,
          published: tool.published,
          featured: tool.featured,
          affiliateUrl: tool.affiliateUrl,
          listingType: tool.listingType,
        }),
      } as Parameters<typeof prisma.tool.update>[0]["data"],
      include: toolInclude,
    });

    await logAudit("update", "tool", `Agent refreshed tool "${updated.name}" from website`, {
      userId,
      entityId: updated.id,
    });

    const serialized = serializeTool(updated);
    return {
      result: { success: true, name: serialized.name, slug: serialized.slug },
      links: [{ label: `Open: ${serialized.name}`, href: `/admin/tools/${updated.id}` }],
    };
  }

  if (name === "set_tool_listing_type") {
    const tool = await findTool(args);
    if (!tool) {
      throw new Error("Tool not found — provide tool_slug, tool_name, or tool_id");
    }

    const listingTypeRaw = String(args.listing_type ?? "").trim().toUpperCase();
    if (listingTypeRaw !== "AFFILIATE" && listingTypeRaw !== "EDITORIAL") {
      throw new Error("listing_type must be AFFILIATE or EDITORIAL");
    }

    const affiliateUrl =
      typeof args.affiliate_url === "string" ? args.affiliate_url.trim() : "";
    if (listingTypeRaw === "AFFILIATE" && !affiliateUrl && !tool.affiliateUrl) {
      throw new Error("AFFILIATE tools need an affiliate_url (tracking link)");
    }

    const updated = await prisma.tool.update({
      where: { id: tool.id },
      data: {
        listingType: listingTypeRaw,
        affiliateUrl:
          listingTypeRaw === "EDITORIAL"
            ? null
            : affiliateUrl || tool.affiliateUrl,
      },
      include: toolInclude,
    });

    await logAudit(
      "update",
      "tool",
      `Set "${updated.name}" listing type to ${listingTypeRaw} via assistant`,
      { userId, entityId: updated.id }
    );

    const serialized = serializeTool(updated);
    return {
      result: {
        success: true,
        name: serialized.name,
        listingType: listingTypeRaw,
      },
      links: [{ label: serialized.name, href: `/admin/tools/${updated.id}` }],
    };
  }

  if (name === "publish_tool") {
    const tool = await findTool(args);
    if (!tool) {
      throw new Error("Tool not found — provide tool_slug, tool_name, or tool_id");
    }

    const published = args.published !== false;
    const action = published ? "publish" : "unpublish";
    const preview = needsConfirmation(userId, "publish_tool", args, args.confirm, {
      action,
      tool: { id: tool.id, name: tool.name, slug: tool.slug, currentlyPublished: tool.published },
      message: published
        ? `This will make "${tool.name}" visible on the public site.`
        : `This will hide "${tool.name}" from the public site.`,
    });
    if (preview) {
      return {
        result: preview,
        cards: [cardFromConfirmation(preview, preview.confirmationToken)],
      };
    }

    if (tool.published === published) {
      return {
        result: {
          success: true,
          alreadyInState: true,
          name: tool.name,
          published: tool.published,
        },
      };
    }

    const updated = await prisma.tool.update({
      where: { id: tool.id },
      data: { published },
      include: toolInclude,
    });

    await logAudit(
      published ? "publish" : "unpublish",
      "tool",
      `${published ? "Published" : "Unpublished"} "${updated.name}" via assistant`,
      { userId, entityId: updated.id }
    );

    const serialized = serializeTool(updated);
    return {
      result: { success: true, name: serialized.name, slug: serialized.slug, published },
      links: [{ label: serialized.name, href: `/admin/tools/${updated.id}` }],
    };
  }

  if (name === "delete_tool") {
    const tool = await findTool(args);
    if (!tool) {
      throw new Error("Tool not found — provide tool_slug, tool_name, or tool_id");
    }

    const preview = needsConfirmation(userId, "delete_tool", args, args.confirm, {
      action: "delete",
      tool: {
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        published: tool.published,
        clicks: tool._count.clicks,
      },
      message: `This permanently deletes "${tool.name}" and cannot be undone.`,
    });
    if (preview) {
      return {
        result: preview,
        cards: [cardFromConfirmation(preview, preview.confirmationToken)],
      };
    }

    await prisma.tool.delete({ where: { id: tool.id } });

    await logAudit("delete", "tool", `Deleted tool "${tool.name}" via assistant`, {
      userId,
      entityId: tool.id,
    });

    return {
      result: { success: true, deleted: tool.name, slug: tool.slug },
    };
  }

  if (name === "list_affiliates") {
    const search = typeof args.search === "string" ? args.search.trim() : "";
    const status = typeof args.status === "string" ? args.status.trim() : "";
    const withoutTool = args.without_tool === true;
    const limit = Math.min(30, Math.max(1, Number(args.limit) || 15));

    const where = {
      ...(search ? { companyName: { contains: search } } : {}),
      ...(status ? { status } : {}),
      ...(withoutTool ? { toolId: null } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.affiliateProgram.findMany({
        where,
        select: {
          id: true,
          companyName: true,
          status: true,
          toolId: true,
          affiliateUrl: true,
          website: true,
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
      }),
      prisma.affiliateProgram.count({ where }),
    ]);

    const affiliates = items.map((a) => ({
      companyName: a.companyName,
      status: a.status,
      hasTool: !!a.toolId,
      editUrl: `/admin/affiliates/${a.id}`,
    }));

    return {
      result: { total, showing: items.length, affiliates },
      cards: cardsFromAffiliateList({ total, showing: items.length, affiliates }),
      links: items.length
        ? [{ label: "Open affiliates CRM", href: "/admin/affiliates" }]
        : undefined,
    };
  }

  if (name === "create_tool_from_affiliate") {
    const affiliate = await findAffiliate(args);
    if (!affiliate) {
      throw new Error("Affiliate not found — provide affiliate_id or company_name");
    }

    const tool = await createToolFromAffiliateProgram(affiliate.id, userId);

    return {
      result: {
        success: true,
        affiliate: affiliate.companyName,
        toolId: tool.id,
        name: tool.name,
        slug: tool.slug,
      },
      links: [{ label: `Open draft: ${tool.name}`, href: `/admin/tools/${tool.id}` }],
    };
  }

  if (name === "get_analytics") {
    const rangeInput = typeof args.range === "string" ? args.range.trim() : "30d";
    const range = ["7d", "30d", "90d", "all"].includes(rangeInput) ? rangeInput : "30d";
    const toolSlug = typeof args.tool_slug === "string" ? args.tool_slug.trim() : undefined;

    const summary = await getAgentAnalyticsSummary(range, toolSlug || undefined);

    return {
      result: summary,
      cards: cardsFromAnalytics(summary),
      links: [{ label: "Full analytics", href: "/admin/analytics" }],
    };
  }

  throw new Error(`Unknown agent tool: ${name}`);
}

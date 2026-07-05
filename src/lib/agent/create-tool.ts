import { assertToolCategoryExists } from "@/lib/categories";
import { logAudit } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { buildToolData, serializeTool } from "@/lib/tool-payload";
import type { AgentToolDraft } from "./tool-research";

const toolInclude = {
  _count: { select: { clicks: true } },
  affiliate: { select: { id: true, status: true, companyName: true } },
} as const;

export async function saveAgentToolDraft(
  draft: AgentToolDraft,
  userId: string
) {
  await assertToolCategoryExists(draft.category);

  const existing = await prisma.tool.findUnique({ where: { slug: draft.slug } });
  if (existing) {
    throw new Error(`A tool with slug "${draft.slug}" already exists`);
  }

  const urlNorm = draft.url.replace(/\/$/, "");
  const existingUrl = await prisma.tool.findFirst({
    where: {
      OR: [{ url: draft.url }, { url: urlNorm }, { url: `${urlNorm}/` }],
    },
    select: { name: true, slug: true },
  });
  if (existingUrl) {
    throw new Error(
      `A tool already exists for this URL: "${existingUrl.name}" (${existingUrl.slug})`
    );
  }

  const body = {
    ...draft,
    affiliateUrl: null,
    listingType: "EDITORIAL",
    published: false,
    featured: false,
  };

  const tool = await prisma.tool.create({
    data: {
      ...buildToolData(body),
      slug: draft.slug,
      name: draft.name,
      description: draft.description,
      overview: draft.overview || draft.description,
      url: draft.url,
      category: draft.category,
      highlights: JSON.stringify(draft.highlights),
      tags: JSON.stringify(draft.tags),
      screenshots: JSON.stringify(draft.screenshots),
      howItWorks: JSON.stringify(draft.howItWorks),
      pricing: JSON.stringify(draft.pricing),
      pros: JSON.stringify(draft.pros),
      cons: JSON.stringify(draft.cons),
      faq: JSON.stringify(draft.faq),
      whoIsItFor: draft.whoIsItFor,
      published: false,
      featured: false,
    } as Parameters<typeof prisma.tool.create>[0]["data"],
    include: toolInclude,
  });

  await logAudit("create", "tool", `Agent created draft tool "${tool.name}"`, {
    userId,
    entityId: tool.id,
  });

  return serializeTool(tool);
}

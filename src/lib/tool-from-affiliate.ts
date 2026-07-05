import { logAffiliateActivity } from "@/lib/affiliate-db";
import { logAudit } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { mapAffiliateCategoryToTool, serializeTool, slugify } from "@/lib/tool-payload";

const toolInclude = {
  _count: { select: { clicks: true } },
  affiliate: { select: { id: true, status: true, companyName: true } },
} as const;

export async function createToolFromAffiliateProgram(
  affiliateId: string,
  userId: string
) {
  const affiliate = await prisma.affiliateProgram.findUnique({
    where: { id: affiliateId },
  });

  if (!affiliate) {
    throw new Error("Affiliate program not found");
  }

  if (affiliate.toolId) {
    throw new Error(
      `Affiliate "${affiliate.companyName}" is already linked to a tool`
    );
  }

  let slug = slugify(affiliate.companyName);
  let suffix = 0;
  while (await prisma.tool.findUnique({ where: { slug } })) {
    suffix++;
    slug = `${slugify(affiliate.companyName)}-${suffix}`;
  }

  const tool = await prisma.tool.create({
    data: {
      slug,
      name: affiliate.companyName,
      description: affiliate.notes ?? `Learn more about ${affiliate.companyName}.`,
      overview: affiliate.notes ?? `Learn more about ${affiliate.companyName}.`,
      highlights: JSON.stringify([]),
      url: affiliate.website ?? affiliate.signupUrl ?? "https://example.com",
      affiliateUrl: affiliate.affiliateUrl,
      listingType: affiliate.affiliateUrl ? "AFFILIATE" : "EDITORIAL",
      category: mapAffiliateCategoryToTool(affiliate.category),
      tags: JSON.stringify([]),
      screenshots: JSON.stringify([]),
      howItWorks: JSON.stringify([]),
      pricing: JSON.stringify([]),
      pros: JSON.stringify([]),
      cons: JSON.stringify([]),
      faq: JSON.stringify([]),
      whoIsItFor: "",
      published: false,
      featured: false,
    },
    include: toolInclude,
  });

  await prisma.affiliateProgram.update({
    where: { id: affiliateId },
    data: { toolId: tool.id },
  });

  await logAffiliateActivity(
    affiliateId,
    "note",
    `Created and linked tool "${tool.name}" (${tool.slug})`,
    userId
  );

  await logAudit("create", "tool", `Created from CRM: "${tool.name}"`, {
    userId,
    entityId: tool.id,
  });

  return serializeTool({
    ...tool,
    affiliate: {
      id: affiliateId,
      status: affiliate.status,
      companyName: affiliate.companyName,
    },
  });
}

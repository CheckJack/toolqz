import { NextRequest, NextResponse } from "next/server";
import { logAffiliateActivity } from "@/lib/affiliate-db";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  mapAffiliateCategoryToTool,
  serializeTool,
  slugify,
} from "@/lib/tool-payload";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const { affiliateId } = await request.json();

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId is required" }, { status: 400 });
    }

    const affiliate = await prisma.affiliateProgram.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    if (affiliate.toolId) {
      return NextResponse.json(
        { error: "Affiliate already linked to a tool", toolId: affiliate.toolId },
        { status: 409 }
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
      include: {
        _count: { select: { clicks: true } },
        affiliate: { select: { id: true, status: true, companyName: true } },
      },
    });

    await prisma.affiliateProgram.update({
      where: { id: affiliateId },
      data: { toolId: tool.id },
    });

    await logAffiliateActivity(
      affiliateId,
      "note",
      `Created and linked tool "${tool.name}" (${tool.slug})`,
      session.id
    );

    await logAudit("create", "tool", `Created from CRM: "${tool.name}"`, {
      userId: session.id,
      entityId: tool.id,
    });

    return NextResponse.json(
      serializeTool({
        ...tool,
        affiliate: {
          id: affiliateId,
          status: affiliate.status,
          companyName: affiliate.companyName,
        },
      }),
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create tool" }, { status: 500 });
  }
}

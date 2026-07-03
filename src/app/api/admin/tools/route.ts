import { NextRequest, NextResponse } from "next/server";
import {
  buildToolWhere,
  parseToolFilters,
  toolOrderBy,
} from "@/lib/tool-query";
import { assertToolCategoryExists } from "@/lib/categories";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildToolData, serializeTool } from "@/lib/tool-payload";

const DEFAULT_PAGE_SIZE = 25;
const toolInclude = {
  _count: { select: { clicks: true } },
  affiliate: { select: { id: true, status: true, companyName: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = request.nextUrl;

    if (searchParams.get("lite") === "true") {
      const tools = await prisma.tool.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(tools);
    }

    const filters = parseToolFilters(searchParams);
    const where = buildToolWhere(filters);
    const sort = searchParams.get("sort") ?? "name";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE))
    );
    const orderBy = toolOrderBy(sort);

    const [items, total, dbCategories] = await Promise.all([
      prisma.tool.findMany({
        where,
        include: toolInclude,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tool.count({ where }),
      prisma.toolCategory.findMany({
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        select: { slug: true, label: true },
      }),
    ]);

    const categories = dbCategories.map((row) => row.slug);

    return NextResponse.json({
      items: items.map(serializeTool),
      total,
      page,
      pageSize,
      categories,
      categoryLabels: Object.fromEntries(dbCategories.map((row) => [row.slug, row.label])),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    if (!body.slug || !body.name || !body.description || !body.url || !body.category) {
      return NextResponse.json(
        { error: "slug, name, description, url, and category are required" },
        { status: 400 }
      );
    }

    try {
      await assertToolCategoryExists(String(body.category));
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid category" },
        { status: 400 }
      );
    }

    const existing = await prisma.tool.findUnique({ where: { slug: body.slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const tool = await prisma.tool.create({
      data: {
        ...buildToolData(body),
        slug: String(body.slug),
        name: String(body.name),
        description: String(body.description),
        overview: String(body.overview ?? body.description),
        url: String(body.url),
        category: String(body.category),
        highlights: JSON.stringify(body.highlights ?? []),
        tags: JSON.stringify(body.tags ?? []),
        screenshots: JSON.stringify(body.screenshots ?? []),
        howItWorks: JSON.stringify(body.howItWorks ?? []),
        pricing: JSON.stringify(body.pricing ?? []),
        pros: JSON.stringify(body.pros ?? []),
        cons: JSON.stringify(body.cons ?? []),
        faq: JSON.stringify(body.faq ?? []),
        whoIsItFor: String(body.whoIsItFor ?? ""),
        published: body.published ?? false,
        featured: body.featured ?? false,
      } as Parameters<typeof prisma.tool.create>[0]["data"],
      include: toolInclude,
    });

    await logAudit("create", "tool", `Created tool "${tool.name}"`, {
      userId: session.id,
      entityId: tool.id,
    });

    return NextResponse.json(serializeTool(tool), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create tool" }, { status: 500 });
  }
}

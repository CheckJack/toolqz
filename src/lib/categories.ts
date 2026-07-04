import { DEFAULT_TOOL_CATEGORIES } from "@/lib/default-tool-categories";
import { prisma } from "@/lib/db";
import type { CategoryInfo } from "@/types";

/** Ensure built-in categories exist (idempotent — safe on every request). */
export async function ensureDefaultToolCategories(): Promise<void> {
  try {
    for (const category of DEFAULT_TOOL_CATEGORIES) {
      await prisma.toolCategory.upsert({
        where: { slug: category.slug },
        create: {
          slug: category.slug,
          label: category.label,
          sortOrder: category.sortOrder,
          published: true,
        },
        update: {},
      });
    }
  } catch {
    // ToolCategory table may not exist until migrations run
  }
}

export function categorySlugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryLabel(category: string, labels?: Record<string, string>): string {
  if (labels?.[category]) return labels[category];
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export async function getPublishedCategories(): Promise<CategoryInfo[]> {
  await ensureDefaultToolCategories();
  try {
    const rows = await prisma.toolCategory.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: { slug: true, label: true },
    });
    if (rows.length > 0) {
      return [{ id: "all", label: "All" }, ...rows.map((row) => ({ id: row.slug, label: row.label }))];
    }
  } catch {
    // ToolCategory table may not exist until migrations run
  }

  const groups = await prisma.tool.groupBy({ by: ["category"] });
  const slugs = [...new Set(groups.map((g) => g.category))].sort();
  return [
    { id: "all", label: "All" },
    ...slugs.map((slug) => ({ id: slug, label: getCategoryLabel(slug) })),
  ];
}

export async function listToolCategoryFilters(): Promise<{
  slugs: string[];
  labels: Record<string, string>;
}> {
  await ensureDefaultToolCategories();
  try {
    const rows = await prisma.toolCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: { slug: true, label: true },
    });
    if (rows.length > 0) {
      return {
        slugs: rows.map((row) => row.slug),
        labels: Object.fromEntries(rows.map((row) => [row.slug, row.label])),
      };
    }
  } catch {
    // ToolCategory table may not exist until migrations run
  }

  const groups = await prisma.tool.groupBy({ by: ["category"] });
  const slugs = groups.map((g) => g.category).sort();
  return {
    slugs,
    labels: Object.fromEntries(slugs.map((slug) => [slug, getCategoryLabel(slug)])),
  };
}

export async function getCategoryLabelMap(): Promise<Record<string, string>> {
  const rows = await prisma.toolCategory.findMany({
    select: { slug: true, label: true },
  });
  return Object.fromEntries(rows.map((row) => [row.slug, row.label]));
}

export async function assertToolCategoryExists(slug: string): Promise<void> {
  await ensureDefaultToolCategories();
  try {
    const category = await prisma.toolCategory.findUnique({ where: { slug } });
    if (!category) {
      throw new Error(`Unknown category "${slug}". Create it under Admin → Categories first.`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unknown category")) {
      throw error;
    }
    // Table missing — allow default slugs until migrations complete
    if (!DEFAULT_TOOL_CATEGORIES.some((c) => c.slug === slug)) {
      throw new Error(`Unknown category "${slug}". Create it under Admin → Categories first.`);
    }
  }
}

export async function listAdminCategories() {
  await ensureDefaultToolCategories();
  try {
    const categories = await prisma.toolCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });

    const toolCounts = await prisma.tool.groupBy({
      by: ["category"],
      _count: true,
    });

    const countBySlug = Object.fromEntries(toolCounts.map((row) => [row.category, row._count]));

    return categories.map((category) => ({
      ...category,
      toolCount: countBySlug[category.slug] ?? 0,
    }));
  } catch {
    const toolCounts = await prisma.tool.groupBy({
      by: ["category"],
      _count: true,
    });

    return toolCounts
      .map((row) => ({
        id: row.category,
        slug: row.category,
        label: getCategoryLabel(row.category),
        description: null,
        sortOrder: 0,
        published: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        toolCount: row._count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
}

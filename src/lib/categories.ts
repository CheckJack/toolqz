import { prisma } from "@/lib/db";
import type { CategoryInfo } from "@/types";

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
  const rows = await prisma.toolCategory.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { slug: true, label: true },
  });

  return [{ id: "all", label: "All" }, ...rows.map((row) => ({ id: row.slug, label: row.label }))];
}

export async function getCategoryLabelMap(): Promise<Record<string, string>> {
  const rows = await prisma.toolCategory.findMany({
    select: { slug: true, label: true },
  });
  return Object.fromEntries(rows.map((row) => [row.slug, row.label]));
}

export async function assertToolCategoryExists(slug: string): Promise<void> {
  const category = await prisma.toolCategory.findUnique({ where: { slug } });
  if (!category) {
    throw new Error(`Unknown category "${slug}". Create it under Admin → Categories first.`);
  }
}

export async function listAdminCategories() {
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
}

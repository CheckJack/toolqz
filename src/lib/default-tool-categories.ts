export const DEFAULT_TOOL_CATEGORIES = [
  { slug: "productivity", label: "Productivity", sortOrder: 0 },
  { slug: "food", label: "Food", sortOrder: 1 },
  { slug: "digital", label: "Digital", sortOrder: 2 },
  { slug: "marketing", label: "Marketing", sortOrder: 3 },
  { slug: "finance", label: "Finance", sortOrder: 4 },
  { slug: "gambling", label: "Gambling", sortOrder: 5 },
  { slug: "health", label: "Health", sortOrder: 6 },
  { slug: "education", label: "Education", sortOrder: 7 },
  { slug: "entertainment", label: "Entertainment", sortOrder: 8 },
  { slug: "shopping", label: "Shopping", sortOrder: 9 },
] as const;

export const DEFAULT_TOOL_CATEGORY_SLUGS = DEFAULT_TOOL_CATEGORIES.map((c) => c.slug);

export function isDefaultToolCategory(slug: string): boolean {
  return DEFAULT_TOOL_CATEGORY_SLUGS.includes(slug as (typeof DEFAULT_TOOL_CATEGORY_SLUGS)[number]);
}

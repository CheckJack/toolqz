import { fetchGa4ToolPageViews, type Ga4Range } from "@/lib/ga4-server";
import { clickRangeStartDate, type ClickRange } from "@/lib/analytics-ranges";
import { prisma } from "@/lib/db";

export interface ToolCtrRow {
  toolId: string;
  name: string;
  slug: string;
  pageViews: number;
  clicks: number;
  ctr: number;
  published: boolean;
}

export async function fetchToolCtrReport(
  ga4Range: Ga4Range,
  clickRange: ClickRange
): Promise<{ configured: boolean; rows: ToolCtrRow[]; warning: string | null }> {
  const pageViews = await fetchGa4ToolPageViews(ga4Range);
  if (!pageViews.configured) {
    return {
      configured: false,
      rows: [],
      warning: pageViews.warning ?? "GA4 not configured — tool CTR requires site traffic data.",
    };
  }

  const rangeStart = clickRangeStartDate(clickRange);
  const rangeFilter = rangeStart ? { clickedAt: { gte: rangeStart } } : {};

  const tools = await prisma.tool.findMany({
    where: { published: true },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { clicks: rangeStart ? { where: rangeFilter } : true } },
    },
    orderBy: { name: "asc" },
  });

  const viewsBySlug = new Map(pageViews.views.map((v) => [v.slug, v.views]));

  const rows: ToolCtrRow[] = tools
    .map((tool) => {
      const pageViewsCount = viewsBySlug.get(tool.slug) ?? 0;
      const clicks = tool._count.clicks;
      const ctr = pageViewsCount > 0 ? (clicks / pageViewsCount) * 100 : 0;
      return {
        toolId: tool.id,
        name: tool.name,
        slug: tool.slug,
        pageViews: pageViewsCount,
        clicks,
        ctr,
        published: true,
      };
    })
    .filter((row) => row.pageViews > 0 || row.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks);

  return { configured: true, rows, warning: pageViews.warning };
}
